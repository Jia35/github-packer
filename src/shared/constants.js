(function bootstrapConstants() {
  const app = (window.GitHubPacker = window.GitHubPacker || {});

  app.constants = {
    namespace: "github-packer",
    toolbarId: "github-packer-toolbar",
    toolbarMarker: "data-github-packer-toolbar",
    rowMarker: "data-github-packer-row",
    spacerMarker: "data-github-packer-spacer",
    checkboxMarker: "data-github-packer-checkbox",
    itemPathMarker: "data-github-packer-item-path",
    itemKindMarker: "data-github-packer-item-kind",
    selectedClassName: "github-packer-selected",
    loadingClassName: "github-packer-loading",
    activeSelectionClassName: "github-packer-has-selection",
    currentDirectoryMeta: "github-packer-current-directory",
    renderDebounceMs: 120,
    selectors: {
      rootMain: "main",
      repositoryNameMeta: 'meta[name="octolytics-dimension-repository_nwo"]',
      branchFeedLink: 'link[rel="alternate"][type="application/atom+xml"][href*="/commits/"]',
      fileLinks:
        'main a[href*="/blob/"], main a[href*="/tree/"]',
      rowContainers: [
        '[role="row"]',
        "tr",
        ".Box-row",
        "li"
      ],
      toolbarHeadings: "main h1, main h2, main h3, main h4"
    },
    labels: {
      selectAll: "全選",
      clearAll: "取消全選",
      clearSelection: "取消選取",
      pack: "打包下載",
      preparing: "準備中..."
    },
    messages: {
      idle: "尚未選取項目",
      resolvingBranch: "確認分支中...",
      loadingTree: "讀取檔案樹中...",
      matchingFiles: "整理選取項目中...",
      downloadingFiles: "下載檔案中...",
      buildingArchive: "建立 ZIP 中...",
      completed: "下載已開始"
    }
  };
})();
