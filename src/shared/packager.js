(function bootstrapPackager() {
  const app = (window.GitHubPacker = window.GitHubPacker || {});
  const constants = app.constants;
  const treeCache = new Map();

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);

    for (let index = 0; index < 256; index += 1) {
      let value = index;

      for (let bit = 0; bit < 8; bit += 1) {
        value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      }

      table[index] = value >>> 0;
    }

    return table;
  })();

  function updateProgress(onProgress, message, detail) {
    if (typeof onProgress === "function") {
      onProgress(message, detail);
    }
  }

  function createApiUrl(path) {
    return `https://api.github.com${path}`;
  }

  function encodePathSegments(path) {
    return path
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }

  async function fetchJson(url, options = {}) {
    const token = await app.auth.getToken();
    const headers = {
      Accept: "application/vnd.github+json"
    };

    if (token) {
      headers["Authorization"] = `token ${token}`;
    }

    const response = await fetch(url, {
      headers,
      credentials: "omit",
      signal: options.signal
    });

    if (!response.ok) {
      let detail = "";

      try {
        const payload = await response.json();
        detail = payload && payload.message ? ` (${payload.message})` : "";
      } catch (error) {
        detail = "";
      }

      const error = new Error(app.i18n.t('messages.apiFailed', {status: response.status, detail}));
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  async function resolveBranch(context) {
    if (context.branch) {
      return context.branch;
    }

    const repo = await fetchJson(createApiUrl(`/repos/${context.owner}/${context.repo}`), { signal: context.signal });
    return repo.default_branch || "";
  }

  async function fetchRepositoryTree(context, branch) {
    const cacheKey = `${context.owner}/${context.repo}:${branch}`;
    if (treeCache.has(cacheKey)) {
      console.log(`[GitHub Packer] Using cached tree for ${cacheKey}`);
      return treeCache.get(cacheKey);
    }

    const encodedRef = encodeURIComponent(branch);
    const tree = await fetchJson(
      createApiUrl(`/repos/${context.owner}/${context.repo}/git/trees/${encodedRef}?recursive=1`),
      { signal: context.signal }
    );

    if (!Array.isArray(tree.tree)) {
      throw new Error(app.i18n.t('messages.noTree'));
    }

    const result = {
      truncated: Boolean(tree.truncated),
      files: tree.tree.filter((entry) => entry && entry.type === "blob" && entry.path)
    };

    treeCache.set(cacheKey, result);
    return result;
  }

  function resolveFilesFromSelection(repositoryFiles, isSelectedPredicate) {
    const matched = repositoryFiles.filter((file) => isSelectedPredicate(file.path));

    return {
      files: matched.sort((left, right) => left.path.localeCompare(right.path)),
      missing: [] // In this model, we filter the tree directly, so "missing" is not applicable in the same way
    };
  }

  function formatMissingPreview(paths) {
    if (!paths.length) {
      return "";
    }

    const preview = paths.slice(0, 5).join(", ");
    const suffix = paths.length > 5 ? app.i18n.t('ui.moreItems', {count: paths.length - 5}) : "";
    return `${preview}${suffix}`;
  }

  async function fetchFileContent(context, branch, path) {
    const token = await app.auth.getToken();
    
    let url;
    let headers = {};

    if (token) {
      // For private repos (or if token is available), use the API with raw media type
      url = createApiUrl(`/repos/${context.owner}/${context.repo}/contents/${encodePathSegments(path)}?ref=${encodeURIComponent(branch)}`);
      headers = {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3.raw"
      };
    } else {
      // Fallback to raw.githubusercontent.com for public repos without token
      url = `https://raw.githubusercontent.com/${context.owner}/${context.repo}/${encodeURIComponent(branch)}/${encodePathSegments(path)}`;
    }

    const response = await fetch(url, { 
      headers,
      credentials: "omit",
      signal: context.signal
    });

    if (!response.ok) {
      const error = new Error(`${app.i18n.t('ui.failedDownload')} ${path}`);
      error.status = response.status;
      throw error;
    }

    return new Uint8Array(await response.arrayBuffer());
  }

  async function mapWithConcurrency(items, concurrency, iteratee, signal) {
    const results = new Array(items.length);
    let cursor = 0;

    async function worker() {
      while (cursor < items.length) {
        if (signal && signal.aborted) {
          return;
        }
        const currentIndex = cursor;
        cursor += 1;
        results[currentIndex] = await iteratee(items[currentIndex], currentIndex);
      }
    }

    const workerCount = Math.min(concurrency, items.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
  }

  function computeCrc32(bytes) {
    let crc = 0xffffffff;

    for (let index = 0; index < bytes.length; index += 1) {
      crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  function getDosDateTime(date) {
    const year = Math.max(1980, date.getFullYear());
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = Math.floor(date.getSeconds() / 2);

    return {
      time: (hours << 11) | (minutes << 5) | seconds,
      date: ((year - 1980) << 9) | (month << 5) | day
    };
  }

  function createLocalHeader(nameBytes, metadata) {
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, metadata.time, true);
    view.setUint16(12, metadata.date, true);
    view.setUint32(14, metadata.crc32, true);
    view.setUint32(18, metadata.size, true);
    view.setUint32(22, metadata.size, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(nameBytes, 30);

    return header;
  }

  function createCentralHeader(nameBytes, metadata, offset) {
    const header = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0x0800, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, metadata.time, true);
    view.setUint16(14, metadata.date, true);
    view.setUint32(16, metadata.crc32, true);
    view.setUint32(20, metadata.size, true);
    view.setUint32(24, metadata.size, true);
    view.setUint16(28, nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, offset, true);
    header.set(nameBytes, 46);

    return header;
  }

  function buildZipBlob(files) {
    const encoder = new TextEncoder();
    const zipParts = [];
    const centralDirectory = [];
    let offset = 0;

    files.forEach((file) => {
      const nameBytes = encoder.encode(file.path);
      const metadata = {
        crc32: computeCrc32(file.bytes),
        size: file.bytes.length,
        ...getDosDateTime(new Date())
      };
      const localHeader = createLocalHeader(nameBytes, metadata);
      const centralHeader = createCentralHeader(nameBytes, metadata, offset);

      zipParts.push(localHeader, file.bytes);
      centralDirectory.push(centralHeader);
      offset += localHeader.length + file.bytes.length;
    });

    const centralDirectorySize = centralDirectory.reduce((total, part) => total + part.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);

    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralDirectorySize, true);
    endView.setUint32(16, offset, true);
    endView.setUint16(20, 0, true);

    return new Blob([...zipParts, ...centralDirectory, endRecord], {
      type: "application/zip"
    });
  }

  function sanitizeFileNamePart(value) {
    return String(value || "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function createArchiveName(context, branch) {
    const branchName = sanitizeFileNamePart(branch || "repo");
    return `${sanitizeFileNamePart(context.repo)}-${branchName}.zip`;
  }

  function triggerDownload(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  async function packSelection(context, isSelectedPredicate, onProgress, options = {}) {
    const signal = options.signal;
    context.signal = signal; // Propagate signal via context for simplicity in inner calls

    if (!context || !context.owner || !context.repo) {
      throw new Error(app.i18n.t('messages.noRepoContext'));
    }

    updateProgress(onProgress, app.i18n.t('messages.resolvingBranch'));
    const branch = await resolveBranch(context);

    if (!branch) {
      throw new Error(app.i18n.t('messages.noBranch'));
    }

    updateProgress(onProgress, app.i18n.t('messages.loadingTree'));
    const tree = await fetchRepositoryTree(context, branch);

    updateProgress(onProgress, app.i18n.t('messages.matchingFiles'));
    const matched = resolveFilesFromSelection(tree.files, isSelectedPredicate);

    if (!matched.files.length) {
      throw new Error(app.i18n.t('messages.noFilesToDownload', {preview: formatMissingPreview(matched.missing)}));
    }

    updateProgress(onProgress, app.i18n.t('messages.downloadingFiles'), `0 / ${matched.files.length}`);
    const downloadedFiles = (await mapWithConcurrency(matched.files, 4, async (file, index) => {
      try {
        const bytes = await fetchFileContent(context, branch, file.path);

        updateProgress(
          onProgress,
          app.i18n.t('messages.downloadingFiles'),
          `${index + 1} / ${matched.files.length}`
        );

        return {
          path: file.path,
          bytes
        };
      } catch (error) {
        if (error.name === "AbortError") {
          // 中止時不印錯誤，我們會在最後統一處理未完成清單
          return null;
        }
        console.error(`[GitHub Packer] Failed to download ${file.path}:`, error);
        return null;
      }
    }, signal)).filter(Boolean);

    const isAborted = signal && signal.aborted;

    // 比對原始計畫與成功下載的檔案，找出所有「未完成」的項目 (包含失敗與被跳過的)
    const downloadedPaths = new Set(downloadedFiles.map((f) => f.path));
    const incompleteFiles = matched.files
      .filter((f) => !downloadedPaths.has(f.path))
      .map((f) => f.path);

    if (!downloadedFiles.length) {
      if (isAborted) {
        const error = new Error(app.i18n.t('messages.downloadAborted'));
        error.name = "AbortError";
        throw error;
      }
      throw new Error(app.i18n.t('messages.allDownloadsFailed'));
    }

    updateProgress(onProgress, app.i18n.t('messages.buildingArchive'));
    const blob = buildZipBlob(downloadedFiles);
    triggerDownload(blob, createArchiveName(context, branch));

    return {
      branch,
      fileCount: downloadedFiles.length,
      failed: incompleteFiles,
      aborted: isAborted,
      missing: matched.missing,
      truncated: tree.truncated
    };
  }

  app.packager = {
    packSelection
  };
})();
