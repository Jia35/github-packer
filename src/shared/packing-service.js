(function bootstrapPackingService() {
  const app = (window.PackerForGitHub = window.PackerForGitHub || {});

  function updateProgress(onProgress, message, detail) {
    if (typeof onProgress === "function") {
      onProgress(message, detail);
    }
  }

  function resolveFilesFromSelection(repositoryFiles, isSelectedPredicate) {
    const matched = repositoryFiles.filter((file) => isSelectedPredicate(file.path));

    return {
      files: matched.sort((left, right) => left.path.localeCompare(right.path)),
      missing: []
    };
  }

  function formatMissingPreview(paths) {
    if (!paths.length) {
      return "";
    }

    const preview = paths.slice(0, 5).join(", ");
    const suffix = paths.length > 5 ? app.i18n.t("ui.moreItems", { count: paths.length - 5 }) : "";
    return `${preview}${suffix}`;
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

  async function pack(options) {
    const context = options && options.context;
    const isSelectedPredicate = options && options.isSelectedPredicate;
    const onProgress = options && options.onProgress;
    const signal = options && options.signal;
    const githubApi = (options && options.githubApi) || app.githubApi;
    const packager = (options && options.packager) || app.packager;

    if (!context || !context.owner || !context.repo) {
      throw new Error(app.i18n.t("messages.noRepoContext"));
    }

    if (typeof isSelectedPredicate !== "function") {
      throw new Error("Missing valid selection predicate");
    }

    updateProgress(onProgress, app.i18n.t("messages.resolvingBranch"));
    const branch = await githubApi.resolveBranch(context, { signal });

    if (!branch) {
      throw new Error(app.i18n.t("messages.noBranch"));
    }

    updateProgress(onProgress, app.i18n.t("messages.loadingTree"));
    const tree = await githubApi.fetchRepositoryTree(context, branch, { signal });

    updateProgress(onProgress, app.i18n.t("messages.matchingFiles"));
    const matched = resolveFilesFromSelection(tree.files, isSelectedPredicate);

    if (!matched.files.length) {
      throw new Error(
        app.i18n.t("messages.noFilesToDownload", {
          preview: formatMissingPreview(matched.missing)
        })
      );
    }

    const concurrency = await app.auth.getConcurrencyLimit();
    updateProgress(onProgress, app.i18n.t("messages.downloadingFiles"), `0 / ${matched.files.length}`);
    const downloadedFiles = (
      await mapWithConcurrency(
        matched.files,
        concurrency,
        async (file, index) => {
          try {
            const bytes = await githubApi.fetchFileContent(context, branch, file.path, { signal });

            updateProgress(
              onProgress,
              app.i18n.t("messages.downloadingFiles"),
              `${index + 1} / ${matched.files.length}`
            );

            return {
              path: file.path,
              bytes
            };
          } catch (error) {
            if (error.name === "AbortError") {
              return null;
            }

            console.error(`[GitHub Packer] Failed to download ${file.path}:`, error);
            return null;
          }
        },
        signal
      )
    ).filter(Boolean);

    const isAborted = signal && signal.aborted;
    const downloadedPaths = new Set(downloadedFiles.map((file) => file.path));
    const incompleteFiles = matched.files
      .filter((file) => !downloadedPaths.has(file.path))
      .map((file) => file.path);

    if (!downloadedFiles.length) {
      if (isAborted) {
        const abortError = new Error(app.i18n.t("messages.downloadAborted"));
        abortError.name = "AbortError";
        throw abortError;
      }

      throw new Error(app.i18n.t("messages.allDownloadsFailed"));
    }

    updateProgress(onProgress, app.i18n.t("messages.buildingArchive"));
    const blob = packager.buildZipBlob(downloadedFiles);
    packager.triggerDownload(blob, packager.createArchiveName(context, branch));

    return {
      branch,
      fileCount: downloadedFiles.length,
      failed: incompleteFiles,
      aborted: isAborted,
      missing: matched.missing,
      truncated: tree.truncated
    };
  }

  app.packingService = {
    pack
  };
})();
