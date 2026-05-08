(function bootstrapContentScript() {
  const app = (window.GitHubPacker = window.GitHubPacker || {});
  const constants = app.constants;

  let renderTimer = null;
  let currentUrl = window.location.href;
  let observer = null;

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

  function handlePack() {
    const selectedItems = app.state.getSelectedItems();

    if (!selectedItems.length || app.state.isPacking()) {
      return;
    }

    app.state.setPacking(true);
    updateBeforeUnloadGuard();
    refresh();

    window.setTimeout(() => {
      app.ui.showPhaseOneAlert(selectedItems);
      app.state.setPacking(false);
      updateBeforeUnloadGuard();
      refresh();
    }, 250);
  }

  function refresh() {
    const items = app.state.getVisibleItems();
    const toolbar = document.getElementById(constants.toolbarId);
    refreshToolbar(items, toolbar);
  }

  function render() {
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
      onPack: handlePack
    });

    refreshToolbar(items, toolbar);
  }

  function scheduleRender() {
    if (renderTimer !== null) {
      window.clearTimeout(renderTimer);
    }

    renderTimer = window.setTimeout(render, constants.renderDebounceMs);
  }

  function handleMutations() {
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
