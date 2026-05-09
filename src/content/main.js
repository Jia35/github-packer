(function bootstrapContentScript() {
  const app = (window.GitHubPacker = window.GitHubPacker || {});
  const constants = app.constants;

  let renderTimer = null;
  let currentUrl = window.location.href;
  let observer = null;
  let contextAlive = true;

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
    const toolbar = document.getElementById(constants.toolbarId);
    if (toolbar) toolbar.remove();
  }

  function updateBeforeUnloadGuard() {
    if (app.state.isPacking()) {
      window.onbeforeunload = () => "正在打包中，確定要離開嗎？";
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

    if (!hasSelection || app.state.isPacking()) {
      return;
    }

    app.state.setPacking(true);
    app.state.setPackingMessage(constants.messages.resolvingBranch);
    app.state.setFailedFiles([]); // 重新開始打包時清除舊紀錄
    app.state.setLastError(null);
    updateBeforeUnloadGuard();
    refresh();

    try {
      const isSelectedPredicate = (path) => app.state.isEffectivelyIncluded(path);
      const result = await app.packager.packSelection(context, isSelectedPredicate, (message, detail) => {
        app.state.setPackingMessage(detail ? `${message} (${detail})` : message);
        refresh();
      });

      app.state.setFailedFiles(result.failed || []);
      app.state.setPackingMessage(constants.messages.completed);
      refresh();
      app.ui.showPackResult(result);
    } catch (error) {
      console.error("[GitHub Packer] pack failed", error);
      app.state.setLastError(error);
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
    if (!isExtensionAlive()) {
      teardown();
      return;
    }

    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
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

  function start() {
    patchHistoryMethod("pushState");
    patchHistoryMethod("replaceState");
    window.addEventListener("popstate", scheduleRender);
    startObserver();
    scheduleRender();
  }

  start();
})();
