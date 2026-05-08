(function bootstrapUi() {
  const app = (window.GitHubPacker = window.GitHubPacker || {});
  const constants = app.constants;

  function createCheckbox(item) {
    const wrapper = document.createElement("label");
    wrapper.className = "github-packer-checkbox";
    wrapper.title = item.kind === "directory" ? "選取資料夾" : "選取檔案";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "github-packer-checkbox__input";
    checkbox.checked = app.state.isSelected(item.path);
    checkbox.setAttribute(constants.checkboxMarker, "true");
    checkbox.setAttribute(constants.itemPathMarker, item.path);
    checkbox.setAttribute(constants.itemKindMarker, item.kind);

    wrapper.appendChild(checkbox);
    return { wrapper, checkbox };
  }

  function markRowSelection(row, isSelected) {
    row.classList.toggle(constants.selectedClassName, isSelected);
  }

  function ensureSpacer(target) {
    if (!target || target.querySelector(`[${constants.spacerMarker}]`)) {
      return;
    }

    const spacer = document.createElement("span");
    spacer.className = "github-packer-checkbox github-packer-checkbox--spacer";
    spacer.setAttribute(constants.spacerMarker, "true");
    spacer.setAttribute("aria-hidden", "true");

    if (typeof target.prepend === "function") {
      target.prepend(spacer);
    } else {
      target.appendChild(spacer);
    }
  }

  function insertCheckboxIntoRow(item, onChange) {
    if (item.element.querySelector(`[${constants.checkboxMarker}]`)) {
      return;
    }

    const target = item.mountTarget || item.link.parentElement;

    if (!target) {
      return;
    }

    const { wrapper, checkbox } = createCheckbox(item);
    checkbox.addEventListener("change", () => {
      onChange(item, checkbox.checked);
      markRowSelection(item.element, checkbox.checked);
    });

    target.classList.add("github-packer-inline-target");

    if (item.link.parentNode === target) {
      item.link.before(wrapper);
    } else if (typeof target.prepend === "function") {
      target.prepend(wrapper);
    } else {
      target.appendChild(wrapper);
    }

    item.element.setAttribute(constants.rowMarker, "true");
    item.element.setAttribute(constants.itemPathMarker, item.path);
    item.element.setAttribute(constants.itemKindMarker, item.kind);
    markRowSelection(item.element, checkbox.checked);
  }

  function getToolbarText(itemCount) {
    if (itemCount <= 0) {
      return constants.messages.idle;
    }

    return `已選取 ${itemCount} 項`;
  }

  function findToolbarHost(items) {
    if (!items.length) {
      return null;
    }

    const headings = Array.from(document.querySelectorAll(constants.selectors.toolbarHeadings));
    const anchorHeading = headings.find((heading) => {
      const text = heading.textContent.trim();
      return text === "Folders and files" || text === "Repository files navigation";
    });

    if (anchorHeading && anchorHeading.parentElement) {
      return anchorHeading.parentElement;
    }

    const firstRow = items[0].element;

    if (!firstRow || !firstRow.parentElement) {
      return null;
    }

    return firstRow.parentElement;
  }

  function syncSelectionVisibility() {
    document.documentElement.classList.toggle(
      constants.activeSelectionClassName,
      app.state.hasSelection()
    );
  }

  function ensureParentDirectorySpacer(row) {
    if (!row) {
      return;
    }

    const link = row.querySelector('a[data-testid="up-tree"], a[aria-label="Parent directory"]');

    if (!link || !app.github.isParentDirectoryRow(row, link)) {
      return;
    }

    const container =
      link.querySelector("div") ||
      link.firstElementChild ||
      link;

    if (!container) {
      return;
    }

    container.classList.add("github-packer-parent-directory-target");
    ensureSpacer(container);
  }

  function ensureToolbar(items, handlers) {
    const host = findToolbarHost(items);

    if (!host) {
      return null;
    }

    let toolbar = document.getElementById(constants.toolbarId);

    if (!toolbar) {
      toolbar = document.createElement("section");
      toolbar.id = constants.toolbarId;
      toolbar.className = "github-packer-toolbar";
      toolbar.setAttribute(constants.toolbarMarker, "true");

      const left = document.createElement("div");
      left.className = "github-packer-toolbar__group";

      const selectAllButton = document.createElement("button");
      selectAllButton.type = "button";
      selectAllButton.className = "github-packer-button github-packer-button--secondary";
      selectAllButton.dataset.action = "toggle-all";
      selectAllButton.addEventListener("click", handlers.onToggleAll);

      const clearSelectionButton = document.createElement("button");
      clearSelectionButton.type = "button";
      clearSelectionButton.className = "github-packer-button github-packer-button--secondary";
      clearSelectionButton.dataset.action = "clear-selection";
      clearSelectionButton.addEventListener("click", handlers.onClearSelection);

      const packButton = document.createElement("button");
      packButton.type = "button";
      packButton.className = "github-packer-button github-packer-button--primary";
      packButton.dataset.action = "pack";
      packButton.addEventListener("click", handlers.onPack);

      const status = document.createElement("p");
      status.className = "github-packer-toolbar__status";
      status.dataset.role = "status";

      left.appendChild(selectAllButton);
      left.appendChild(clearSelectionButton);
      left.appendChild(packButton);
      toolbar.appendChild(left);
      toolbar.appendChild(status);
    }

    if (!toolbar.isConnected) {
      host.parentElement.insertBefore(toolbar, host);
    }

    return toolbar;
  }

  function syncToolbar(toolbar, items) {
    if (!toolbar) {
      return;
    }

    const selectedCount = app.state.getSelectedItems().length;
    const visibleSelectedCount = items.filter((item) => app.state.isSelected(item.path)).length;
    const toggleAllButton = toolbar.querySelector('[data-action="toggle-all"]');
    const clearSelectionButton = toolbar.querySelector('[data-action="clear-selection"]');
    const packButton = toolbar.querySelector('[data-action="pack"]');
    const status = toolbar.querySelector('[data-role="status"]');
    const allVisibleSelected = items.length > 0 && visibleSelectedCount === items.length;
    const isPacking = app.state.isPacking();
    const packingMessage = app.state.getPackingMessage();
    const hasSelection = selectedCount > 0;

    toggleAllButton.textContent = allVisibleSelected
      ? constants.labels.clearAll
      : constants.labels.selectAll;
    toggleAllButton.disabled = isPacking || items.length === 0;
    clearSelectionButton.textContent = constants.labels.clearSelection;
    clearSelectionButton.disabled = isPacking || !hasSelection;
    packButton.textContent = isPacking ? constants.labels.preparing : constants.labels.pack;
    packButton.disabled = isPacking || !hasSelection;
    status.textContent = isPacking ? packingMessage || constants.messages.resolvingBranch : getToolbarText(selectedCount);
    toolbar.classList.toggle(constants.loadingClassName, isPacking);
    toolbar.classList.toggle("github-packer-toolbar--visible", hasSelection || isPacking);
    syncSelectionVisibility();
  }

  function syncCheckboxes(items) {
    syncSelectionVisibility();

    items.forEach((item) => {
      if (!item || !item.element) {
        return;
      }

      const checkbox = item.element.querySelector(`[${constants.checkboxMarker}]`);

      if (!checkbox) {
        return;
      }

      const isSelected = app.state.isSelected(item.path);
      checkbox.checked = isSelected;
      markRowSelection(item.element, isSelected);
    });
  }

  function showPackResult(result) {
    if (!result) {
      return;
    }

    const notices = [];

    if (result.truncated) {
      notices.push("這個儲存庫的檔案樹回傳結果被 GitHub 截斷，部分深層檔案可能未被包含。");
    }

    if (result.missing && result.missing.length) {
      const preview = result.missing.slice(0, 6).join("\n");
      const suffix = result.missing.length > 6 ? `\n...以及另外 ${result.missing.length - 6} 項` : "";
      notices.push(`部分項目在目前分支中找不到，已略過：\n${preview}${suffix}`);
    }

    if (notices.length) {
      window.alert(notices.join("\n\n"));
    }
  }

  function showPackError(error) {
    const message = error && error.message ? error.message : "打包下載失敗";
    window.alert(message);
  }

  app.ui = {
    ensureToolbar,
    ensureParentDirectorySpacer,
    insertCheckboxIntoRow,
    syncCheckboxes,
    syncToolbar,
    showPackResult,
    showPackError
  };
})();
