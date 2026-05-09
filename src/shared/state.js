(function bootstrapState() {
  const app = (window.GitHubPacker = window.GitHubPacker || {});

  const state = {
    includeItems: new Map(), // Key: path, Value: item
    excludePaths: new Set(), // Set of paths
    visibleItems: [],
    isPacking: false,
    packingMessage: "",
    failedFiles: []
  };

  function cloneItem(item) {
    return {
      path: item.path,
      kind: item.kind,
      name: item.name,
      href: item.href
    };
  }

  function getAncestors(path) {
    const segments = path.split("/");
    const ancestors = [];
    for (let i = 1; i <= segments.length; i++) {
      ancestors.push(segments.slice(0, i).join("/"));
    }
    return ancestors;
  }

  app.state = {
    getSelectedItems() {
      // For backward compatibility, return all items that are effectively included
      // Wait, if we return everything, the packager might get confused if it also does hierarchy.
      // Let's return the minimal set of instructions: includeItems and excludePaths.
      // But packager.js expects an array of items.
      // Let's return the explicitly included items for now, 
      // but we will update packager.js to handle the sets properly.
      return Array.from(state.includeItems.values()).map(cloneItem);
    },
    getExcludePaths() {
      return Array.from(state.excludePaths);
    },
    hasSelection() {
      return state.includeItems.size > 0;
    },
    setVisibleItems(items) {
      state.visibleItems = items.slice();
    },
    getVisibleItems() {
      return state.visibleItems.slice();
    },
    isEffectivelyIncluded(path) {
      const ancestors = getAncestors(path).reverse(); // From self to root
      for (const p of ancestors) {
        if (state.excludePaths.has(p)) {
          return false;
        }
        if (state.includeItems.has(p)) {
          return true;
        }
      }
      return false;
    },
    getSelectionStatus(path) {
      const isInc = this.isEffectivelyIncluded(path);

      if (isInc) {
        // Effectively included. Is it partially excluded?
        const prefix = path + "/";
        for (const exPath of state.excludePaths) {
          if (exPath === path || exPath.startsWith(prefix)) {
            return "indeterminate";
          }
        }
        return "checked";
      } else {
        // Effectively excluded. Is it partially included?
        const prefix = path + "/";
        for (const incPath of state.includeItems.keys()) {
          if (incPath.startsWith(prefix)) {
            return "indeterminate";
          }
        }
        return "unchecked";
      }
    },
    isSelected(path) {
      // Backward compatibility: used by ui.js to check the box
      return this.isEffectivelyIncluded(path);
    },
    toggleSelection(item, isSelected) {
      if (!item || !item.path) {
        return;
      }

      const path = item.path;
      const prefix = path + "/";

      if (isSelected) {
        // 1. Add to include list
        state.includeItems.set(path, cloneItem(item));
        
        // 2. Remove from exclude list (self and descendants)
        state.excludePaths.delete(path);
        for (const exPath of state.excludePaths) {
          if (exPath.startsWith(prefix)) {
            state.excludePaths.delete(exPath);
          }
        }

        // 3. Cleanup: If we are checking a folder, we can remove its descendants from includeItems
        // because they are now redundant.
        for (const incPath of state.includeItems.keys()) {
          if (incPath !== path && incPath.startsWith(prefix)) {
            state.includeItems.delete(incPath);
          }
        }
      } else {
        // 1. If it was explicitly included, remove it
        state.includeItems.delete(path);

        // 2. Remove all descendants from both lists
        for (const incPath of state.includeItems.keys()) {
          if (incPath.startsWith(prefix)) {
            state.includeItems.delete(incPath);
          }
        }
        for (const exPath of state.excludePaths) {
          if (exPath.startsWith(prefix)) {
            state.excludePaths.delete(exPath);
          }
        }

        // 3. If any ancestor is included, we need to explicitly exclude this path
        const ancestors = getAncestors(path);
        ancestors.pop(); // Remove self
        let hasIncludedAncestor = false;
        for (const p of ancestors.reverse()) {
          if (state.excludePaths.has(p)) break; // Stop at nearest exclusion
          if (state.includeItems.has(p)) {
            hasIncludedAncestor = true;
            break;
          }
        }

        if (hasIncludedAncestor) {
          state.excludePaths.add(path);
        }
      }
    },
    clearSelection() {
      state.includeItems.clear();
      state.excludePaths.clear();
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
    },
    setFailedFiles(files) {
      state.failedFiles = Array.isArray(files) ? files : [];
    },
    getFailedFiles() {
      return state.failedFiles || [];
    }
  };
})();
