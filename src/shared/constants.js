(function bootstrapConstants() {
  const app = (window.PackerForGitHub = window.PackerForGitHub || {});

  app.constants = {
    namespace: "packer-for-github",
    toolbarId: "packer-for-github-toolbar",
    toolbarMarker: "data-packer-for-github-toolbar",
    rowMarker: "data-packer-for-github-row",
    spacerMarker: "data-packer-for-github-spacer",
    checkboxMarker: "data-packer-for-github-checkbox",
    targetMarker: "data-packer-for-github-target",
    itemPathMarker: "data-packer-for-github-item-path",
    itemKindMarker: "data-packer-for-github-item-kind",
    selectedClassName: "packer-for-github-selected",
    loadingClassName: "packer-for-github-loading",
    activeSelectionClassName: "packer-for-github-has-selection",
    currentDirectoryMeta: "packer-for-github-current-directory",
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
