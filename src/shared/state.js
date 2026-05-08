(function bootstrapState() {
  const app = (window.GitHubPacker = window.GitHubPacker || {});

  const state = {
    selectedItems: new Map(),
    visibleItems: [],
    isPacking: false,
    packingMessage: ""
  };

  function cloneItem(item) {
    return {
      path: item.path,
      kind: item.kind,
      name: item.name,
      href: item.href
    };
  }

  app.state = {
    getSelectedItems() {
      return Array.from(state.selectedItems.values()).map(cloneItem);
    },
    hasSelection() {
      return state.selectedItems.size > 0;
    },
    setVisibleItems(items) {
      state.visibleItems = items.slice();
    },
    getVisibleItems() {
      return state.visibleItems.slice();
    },
    isSelected(path) {
      return state.selectedItems.has(path);
    },
    toggleSelection(item, isSelected) {
      if (!item || !item.path) {
        return;
      }

      if (isSelected) {
        state.selectedItems.set(item.path, cloneItem(item));
        return;
      }

      state.selectedItems.delete(item.path);
    },
    clearSelection() {
      state.selectedItems.clear();
    },
    setPacking(isPacking) {
      state.isPacking = Boolean(isPacking);
      if (!state.isPacking) {
        state.packingMessage = "";
      }
    },
    isPacking() {
      return state.isPacking;
    },
    setPackingMessage(message) {
      state.packingMessage = message || "";
    },
    getPackingMessage() {
      return state.packingMessage;
    }
  };
})();
