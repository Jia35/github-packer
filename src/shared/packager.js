(function bootstrapPackager() {
  const app = (window.GitHubPacker = window.GitHubPacker || {});
  const constants = app.constants;

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

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json"
      },
      credentials: "omit"
    });

    if (!response.ok) {
      let detail = "";

      try {
        const payload = await response.json();
        detail = payload && payload.message ? ` (${payload.message})` : "";
      } catch (error) {
        detail = "";
      }

      const error = new Error(`GitHub API 請求失敗：${response.status}${detail}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  async function resolveBranch(context) {
    if (context.branch) {
      return context.branch;
    }

    const repo = await fetchJson(createApiUrl(`/repos/${context.owner}/${context.repo}`));
    return repo.default_branch || "";
  }

  async function fetchRepositoryTree(context, branch) {
    const encodedRef = encodeURIComponent(branch);
    const tree = await fetchJson(
      createApiUrl(`/repos/${context.owner}/${context.repo}/git/trees/${encodedRef}?recursive=1`)
    );

    if (!Array.isArray(tree.tree)) {
      throw new Error("無法取得儲存庫檔案樹");
    }

    return {
      truncated: Boolean(tree.truncated),
      files: tree.tree.filter((entry) => entry && entry.type === "blob" && entry.path)
    };
  }

  function normalizeSelectedPaths(selectedItems) {
    const seen = new Set();

    return selectedItems.filter((item) => {
      if (!item || !item.path || seen.has(item.path)) {
        return false;
      }

      seen.add(item.path);
      return true;
    });
  }

  function resolveFilesFromSelection(repositoryFiles, selectedItems) {
    const filesByPath = new Map(repositoryFiles.map((file) => [file.path, file]));
    const matched = new Map();
    const missing = [];

    normalizeSelectedPaths(selectedItems).forEach((item) => {
      if (item.kind === "file") {
        const file = filesByPath.get(item.path);

        if (!file) {
          missing.push(item.path);
          return;
        }

        matched.set(file.path, file);
        return;
      }

      const prefix = `${item.path}/`;
      let found = false;

      repositoryFiles.forEach((file) => {
        if (file.path.startsWith(prefix)) {
          matched.set(file.path, file);
          found = true;
        }
      });

      if (!found) {
        missing.push(item.path);
      }
    });

    return {
      files: Array.from(matched.values()).sort((left, right) => left.path.localeCompare(right.path)),
      missing
    };
  }

  function formatMissingPreview(paths) {
    if (!paths.length) {
      return "";
    }

    const preview = paths.slice(0, 5).join(", ");
    const suffix = paths.length > 5 ? ` ...還有 ${paths.length - 5} 項` : "";
    return `${preview}${suffix}`;
  }

  async function fetchFileContent(context, branch, path) {
    const response = await fetch(
      `https://raw.githubusercontent.com/${context.owner}/${context.repo}/${encodeURIComponent(branch)}/${encodePathSegments(path)}`,
      { credentials: "omit" }
    );

    if (!response.ok) {
      const error = new Error(`下載檔案失敗: ${path}`);
      error.status = response.status;
      throw error;
    }

    return new Uint8Array(await response.arrayBuffer());
  }

  async function mapWithConcurrency(items, concurrency, iteratee) {
    const results = new Array(items.length);
    let cursor = 0;

    async function worker() {
      while (cursor < items.length) {
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

  async function packSelection(context, selectedItems, onProgress) {
    if (!context || !context.owner || !context.repo) {
      throw new Error("找不到目前的 GitHub 儲存庫資訊");
    }

    updateProgress(onProgress, constants.messages.resolvingBranch);
    const branch = await resolveBranch(context);

    if (!branch) {
      throw new Error("無法判斷目前分支");
    }

    updateProgress(onProgress, constants.messages.loadingTree);
    const tree = await fetchRepositoryTree(context, branch);

    updateProgress(onProgress, constants.messages.matchingFiles);
    const matched = resolveFilesFromSelection(tree.files, selectedItems);

    if (!matched.files.length) {
      throw new Error(`找不到可下載的檔案：${formatMissingPreview(matched.missing)}`);
    }

    updateProgress(onProgress, constants.messages.downloadingFiles, `0 / ${matched.files.length}`);
    const downloadedFiles = await mapWithConcurrency(matched.files, 4, async (file, index) => {
      const bytes = await fetchFileContent(context, branch, file.path);

      updateProgress(
        onProgress,
        constants.messages.downloadingFiles,
        `${index + 1} / ${matched.files.length}`
      );

      return {
        path: file.path,
        bytes
      };
    });

    updateProgress(onProgress, constants.messages.buildingArchive);
    const blob = buildZipBlob(downloadedFiles);
    triggerDownload(blob, createArchiveName(context, branch));

    return {
      branch,
      fileCount: downloadedFiles.length,
      missing: matched.missing,
      truncated: tree.truncated
    };
  }

  app.packager = {
    packSelection
  };
})();
