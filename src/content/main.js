(function bootstrapContentScript() {
  const app = (window.PackerForGitHub = window.PackerForGitHub || {});
  const constants = app.constants;

  let renderTimer = null;
  let currentUrl = window.location.href;
  let observer = null;
  let contextAlive = true;
  let suppressMutationHandling = false;
  let suppressMutationTimer = null;

  function isExtensionAlive() {
    if (!contextAlive) return false;
    return isContextValid();
  }

  function isContextValid() {
    try {
      return typeof chrome !== "undefined" && !!chrome.runtime && !!chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  function teardown() {
    contextAlive = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (renderTimer !== null) {
      window.clearTimeout(renderTimer);
      renderTimer = null;
    }
    if (suppressMutationTimer !== null) {
      window.clearTimeout(suppressMutationTimer);
      suppressMutationTimer = null;
    }
    const toolbar = document.getElementById(constants.toolbarId);
    if (toolbar) toolbar.remove();
  }

  function suppressOwnMutations() {
    suppressMutationHandling = true;
    if (suppressMutationTimer !== null) {
      window.clearTimeout(suppressMutationTimer);
    }

    suppressMutationTimer = window.setTimeout(() => {
      suppressMutationHandling = false;
      suppressMutationTimer = null;
    }, constants.renderDebounceMs * 2);
  }

  function isManagedNode(node) {
    if (!(node instanceof Element)) {
      return false;
    }

    if (node.id === constants.toolbarId || node.closest(`#${constants.toolbarId}`)) {
      return true;
    }

    if (
      node.hasAttribute(constants.toolbarMarker) ||
      node.hasAttribute(constants.checkboxMarker) ||
      node.hasAttribute(constants.spacerMarker) ||
      node.hasAttribute(constants.targetMarker) ||
      node.hasAttribute(constants.rowMarker)
    ) {
      return true;
    }

    return Boolean(
      node.closest(
        `[${constants.toolbarMarker}],` +
          `[${constants.checkboxMarker}],` +
          `[${constants.spacerMarker}],` +
          `[${constants.targetMarker}],` +
          `[${constants.rowMarker}]`
      )
    );
  }

  function shouldHandleMutations(mutations) {
    for (const mutation of mutations) {
      if (!isManagedNode(mutation.target)) {
        return true;
      }

      for (const node of mutation.addedNodes) {
        if (!isManagedNode(node)) {
          return true;
        }
      }

      for (const node of mutation.removedNodes) {
        if (!isManagedNode(node)) {
          return true;
        }
      }
    }

    return false;
  }

  function updateBeforeUnloadGuard() {
    if (app.state.isPacking()) {
      window.onbeforeunload = () => app.i18n.t('labels.cancel'); // Or a custom message if needed
      return;
    }

    window.onbeforeunload = null;
  }

  function refreshToolbar(items, toolbar) {
    app.ui.syncCheckboxes(items);
    app.ui.syncToolbar(toolbar, items);
  }

  function handleSelectionChange(item, isSelected) {
    app.state.toggleSelection(item, isSelected);
    refresh();
  }

  function handleToggleAll() {
    const visibleItems = app.state.getVisibleItems();
    const shouldSelectAll = visibleItems.some((item) => !app.state.isSelected(item.path));

    visibleItems.forEach((item) => {
      app.state.toggleSelection(item, shouldSelectAll);
    });

    refresh();
  }

  function handleClearSelection() {
    app.state.clearSelection();
    refresh();
  }

  async function handlePack() {
    const hasSelection = app.state.hasSelection();
    const context = app.github.getRepositoryContext();

    if (!hasSelection) {
      return;
    }

    if (app.state.isPacking()) {
      app.state.cancelPacking();
      return;
    }

    app.state.setPacking(true);
    app.state.setPackingMessage(app.i18n.t('messages.resolvingBranch'));
    app.state.setFailedFiles([]); // 重新開始打包時清除舊紀錄
    app.state.setLastError(null);
    updateBeforeUnloadGuard();
    refresh();

    try {
      const signal = app.state.getSignal();
      const result = await app.packingService.pack({
        context,
        signal,
        isSelectedPredicate: (path) => app.state.isEffectivelyIncluded(path),
        onProgress: (message, detail) => {
          app.state.setPackingMessage(detail ? `${message} (${detail})` : message);
          refresh();
        }
      });

      app.state.setFailedFiles(result.failed || []);
      app.state.setAborted(result.aborted || false);
      
      if (result.aborted) {
        app.state.setPackingMessage(app.i18n.t('ui.abortedDownload').replace('：', ''));
      } else {
        app.state.setPackingMessage(app.i18n.t('messages.completed'));
      }
      
      refresh();
      app.ui.showPackResult(result);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("[Packer for GitHub] packing cancelled before any downloads");
        app.state.setPackingMessage(app.i18n.t('labels.cancel'));
        app.state.setFailedFiles([]); // 尚未開始就中止，不顯示清單
      } else {
        console.error("[Packer for GitHub] pack failed", error);
        app.state.setLastError(error);
      }
    } finally {
      window.setTimeout(() => {
        app.state.setPacking(false);
        updateBeforeUnloadGuard();
        refresh();
      }, 600);
    }
  }

  function refresh() {
    if (!isExtensionAlive()) {
      teardown();
      return;
    }
    const items = app.state.getVisibleItems();
    const toolbar = document.getElementById(constants.toolbarId);
    refreshToolbar(items, toolbar);
  }

  function render() {
    if (!isExtensionAlive()) {
      teardown();
      return;
    }
    renderTimer = null;
    suppressOwnMutations();

    if (!app.github.isSupportedRepositoryPage()) {
      const existingToolbar = document.getElementById(constants.toolbarId);

      if (existingToolbar) {
        existingToolbar.remove();
      }

      app.state.setVisibleItems([]);
      return;
    }

    const context = app.github.getRepositoryContext();
    const items = app.github.findRepositoryItems(context);

    app.state.setVisibleItems(items);
    document.querySelectorAll("tr, [role='row'], .Box-row, li").forEach((row) => {
      app.ui.ensureParentDirectorySpacer(row);
    });

    if (!items.length) {
      const existingToolbar = document.getElementById(constants.toolbarId);

      if (existingToolbar) {
        existingToolbar.remove();
      }

      return;
    }

    items.forEach((item) => {
      app.ui.insertCheckboxIntoRow(item, handleSelectionChange);
    });

    const toolbar = app.ui.ensureToolbar(items, {
      onToggleAll: handleToggleAll,
      onClearSelection: handleClearSelection,
      onPack: handlePack
    });

    refreshToolbar(items, toolbar);
  }

  function scheduleRender() {
    if (!isExtensionAlive()) {
      teardown();
      return;
    }
    if (renderTimer !== null) {
      window.clearTimeout(renderTimer);
    }

    renderTimer = window.setTimeout(render, constants.renderDebounceMs);
  }

  function handleMutations() {
    const mutations = Array.from(arguments[0] || []);

    if (!isExtensionAlive()) {
      teardown();
      return;
    }

    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      scheduleRender();
      return;
    }

    if (suppressMutationHandling) {
      return;
    }

    if (!shouldHandleMutations(mutations)) {
      return;
    }

    scheduleRender();
  }

  function startObserver() {
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver(handleMutations);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function patchHistoryMethod(methodName) {
    const original = history[methodName];

    history[methodName] = function patchedHistoryMethod() {
      const result = original.apply(this, arguments);
      scheduleRender();
      return result;
    };
  }

  async function start() {
    await app.i18n.init();
    patchHistoryMethod("pushState");
    patchHistoryMethod("replaceState");
    window.addEventListener("popstate", scheduleRender);
    startObserver();
    scheduleRender();
  }

  start();
})();
