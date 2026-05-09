(function bootstrapConstants() {
  const app = (window.GitHubPacker = window.GitHubPacker || {});

  app.constants = {
    namespace: "github-packer",
    toolbarId: "github-packer-toolbar",
    toolbarMarker: "data-github-packer-toolbar",
    rowMarker: "data-github-packer-row",
    spacerMarker: "data-github-packer-spacer",
    checkboxMarker: "data-github-packer-checkbox",
    targetMarker: "data-github-packer-target",
    itemPathMarker: "data-github-packer-item-path",
    itemKindMarker: "data-github-packer-item-kind",
    selectedClassName: "github-packer-selected",
    loadingClassName: "github-packer-loading",
    activeSelectionClassName: "github-packer-has-selection",
    currentDirectoryMeta: "github-packer-current-directory",
    renderDebounceMs: 120,
    selectors: {
      rootMain: "main",
      fileTreeRoot: "#repos-file-tree",
      fileTreeItems: '#repos-file-tree li[role="treeitem"]',
      breadcrumbs: '[data-testid="breadcrumbs"]',
      repositoryNameMeta: 'meta[name="octolytics-dimension-repository_nwo"]',
      branchFeedLink: 'link[rel="alternate"][type="application/atom+xml"][href*="/commits/"]',
      fileLinks:
        'a[href*="/blob/"], a[href*="/tree/"]',
      rowContainers: [
        '[role="row"]',
        "tr",
        ".Box-row",
        "li"
      ],
      toolbarHeadings: "main h1, main h2, main h3, main h4"
    }
  };
})();
