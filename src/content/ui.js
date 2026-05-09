(function bootstrapUi() {
  const app = (window.PackerForGitHub = window.PackerForGitHub || {});
  const constants = app.constants;

  const ICONS = {
    download: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 8px;"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"></path><path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"></path></svg>`,
    spinner: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="packer-for-github-spinner" style="margin-right: 8px;"><path d="M8 1.5a6.5 6.5 0 1 0 6.5 6.5.75.75 0 0 1 1.5 0 8 8 0 1 1-8-8 .75.75 0 0 1 0 1.5Z"></path></svg>`,
    cancel: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 8px;"><path d="M2.343 13.657A8 8 0 1 1 13.657 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z"></path></svg>`
  };

  function setNodeChildren(node, children) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }

    children.forEach((child) => {
      node.appendChild(child);
    });
  }

  function createIconFragment(svgMarkup) {
    const template = document.createElement("template");
    template.innerHTML = svgMarkup.trim();
    return template.content.firstElementChild;
  }

  function updatePackButtonContent(button, isPacking) {
    if (!button) {
      return;
    }

    const currentMode = button.dataset.mode;
    const nextMode = isPacking ? "packing" : "idle";
    if (currentMode === nextMode) {
      return;
    }

    const iconMarkup = isPacking ? ICONS.cancel : ICONS.download;
    const labelText = isPacking ? app.i18n.t('labels.cancel') : app.i18n.t('labels.pack');
    
    const icon = createIconFragment(iconMarkup);
    const label = document.createElement("span");
    label.textContent = labelText;

    setNodeChildren(button, [icon, label]);
    button.dataset.mode = nextMode;
    
    // 切換樣式
    button.classList.toggle("packer-for-github-button--primary", !isPacking);
    button.classList.toggle("packer-for-github-button--danger", isPacking);
    button.classList.add("packer-for-github-button--fixed-width");
  }

  function renderToolbarErrors(errors, failedFiles, lastError) {
    if (!errors) {
      return;
    }

    if (!failedFiles.length && !lastError) {
      errors.style.display = "none";
      errors.replaceChildren();
      return;
    }

    const container = document.createElement("div");
    container.style.color = "var(--tp-error, #ff7b72)";
    container.style.fontSize = "13px";
    container.style.marginBottom = "4px";
    container.style.lineHeight = "1.4";

    if (lastError && (lastError.status === 401 || lastError.status === 404)) {
      const strong = document.createElement("strong");
      strong.textContent = app.i18n.t('ui.permissionDenied');
      container.appendChild(strong);
      container.appendChild(document.createTextNode(app.i18n.t('ui.tokenExpired')));
      container.appendChild(document.createElement("br"));

      const settingsLink = document.createElement("a");
      settingsLink.href = "#";
      settingsLink.dataset.action = "open-settings";
      settingsLink.style.color = "#58a6ff";
      settingsLink.style.textDecoration = "underline";
      settingsLink.textContent = app.i18n.t('ui.goToSettings');
      settingsLink.addEventListener("click", (e) => {
        e.preventDefault();
        openOptionsPage();
      });
      container.appendChild(settingsLink);
    } else if (failedFiles.length > 0) {
      const threshold = 15;
      const visibleFailed = failedFiles.slice(0, threshold);
      const moreCount = failedFiles.length - threshold;
      const isAborted = app.state.isAborted();

      const strong = document.createElement("strong");
      strong.textContent = isAborted ? app.i18n.t('ui.abortedDownload') : app.i18n.t('ui.failedDownload');
      container.appendChild(strong);
      container.appendChild(document.createElement("br"));

      visibleFailed.forEach((file) => {
        container.appendChild(document.createTextNode(`• ${file.split("/").pop()}`));
        container.appendChild(document.createElement("br"));
      });

      if (moreCount > 0) {
        container.appendChild(document.createTextNode(app.i18n.t('ui.moreItems', {count: moreCount})));
      } else if (container.lastChild?.nodeName === "BR") {
        container.removeChild(container.lastChild);
      }
    } else if (lastError) {
      const strong = document.createElement("strong");
      strong.textContent = app.i18n.t('ui.errorOccurred');
      container.appendChild(strong);
      container.appendChild(document.createTextNode(` ${lastError.message || app.i18n.t('labels.pack')}`));
    }

    errors.style.display = "block";
    errors.replaceChildren(container);
  }

  function createCheckbox(item) {
    const wrapper = document.createElement("label");
    wrapper.className = "packer-for-github-checkbox";
    wrapper.title = item.kind === "directory" ? app.i18n.t('ui.selectFolder') : app.i18n.t('ui.selectFile');

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "packer-for-github-checkbox__input";
    checkbox.checked = app.state.isSelected(item.path);
    checkbox.setAttribute(constants.checkboxMarker, "true");
    checkbox.setAttribute(constants.itemPathMarker, item.path);
    checkbox.setAttribute(constants.itemKindMarker, item.kind);

    wrapper.appendChild(checkbox);
    return { wrapper, checkbox };
  }

  function getEffectiveTheme() {
    const mode = document.documentElement.dataset.colorMode;
    if (mode === "dark") return "dark";
    if (mode === "light") return "light";
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  }

  function isContextValid() {
    try {
      return typeof chrome !== "undefined" && !!chrome.runtime && !!chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  function getAssetUrl(path) {
    if (!isContextValid()) return "";
    try {
      return chrome.runtime.getURL(path);
    } catch (e) {
      return "";
    }
  }

  function openOptionsPage() {
    if (!isContextValid()) return;
    chrome.runtime.sendMessage({ action: "openOptionsPage" });
  }

  function markRowSelection(row, isSelected) {
    row.classList.toggle(constants.selectedClassName, isSelected);
  }

  function ensureSpacer(target) {
    if (!target || target.querySelector(`[${constants.spacerMarker}]`)) {
      return;
    }

    const spacer = document.createElement("span");
    spacer.className = "packer-for-github-checkbox packer-for-github-checkbox--spacer";
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

    const target = item.mountTarget || (item.link ? item.link.parentElement : null);

    if (!target) {
      return;
    }

    const { wrapper, checkbox } = createCheckbox(item);
    checkbox.addEventListener("change", () => {
      onChange(item, checkbox.checked);
      markRowSelection(item.element, checkbox.checked);
    });

    // 阻止點擊 Checkbox 時觸發 GitHub 原生的行點擊行為
    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    target.classList.add("packer-for-github-inline-target");
    target.setAttribute(constants.targetMarker, "true");

    if (item.link && item.link.parentNode === target) {
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
      return app.i18n.t('messages.idle');
    }

    return app.i18n.t('ui.selectedItems', {count: itemCount});
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

    container.classList.add("packer-for-github-parent-directory-target");
    ensureSpacer(container);
  }

  function ensureToolbar(items, handlers) {
    if (!items.length || !document.body) {
      return null;
    }

    let toolbar = document.getElementById(constants.toolbarId);

    if (!toolbar) {
      toolbar = document.createElement("section");
      toolbar.id = constants.toolbarId;
      toolbar.className = "packer-for-github-toolbar";
      toolbar.title = "Packer for GitHub";
      toolbar.setAttribute(constants.toolbarMarker, "true");

      const left = document.createElement("div");
      left.className = "packer-for-github-toolbar__group";

      const selectAllButton = document.createElement("button");
      selectAllButton.type = "button";
      selectAllButton.className = "packer-for-github-button packer-for-github-button--secondary";
      selectAllButton.dataset.action = "toggle-all";
      selectAllButton.addEventListener("click", handlers.onToggleAll);

      const clearSelectionButton = document.createElement("button");
      clearSelectionButton.type = "button";
      clearSelectionButton.className = "packer-for-github-button packer-for-github-button--secondary";
      clearSelectionButton.dataset.action = "clear-selection";
      clearSelectionButton.addEventListener("click", handlers.onClearSelection);

      const packButton = document.createElement("button");
      packButton.type = "button";
      packButton.className = "packer-for-github-button packer-for-github-button--primary";
      packButton.dataset.action = "pack";
      packButton.addEventListener("click", handlers.onPack);
      updatePackButtonContent(packButton, false);

      const status = document.createElement("p");
      status.className = "packer-for-github-toolbar__status";
      status.dataset.role = "status";

      const errors = document.createElement("div");
      errors.className = "packer-for-github-toolbar__errors";
      errors.dataset.role = "error-report";
      errors.style.display = "none";

      left.appendChild(selectAllButton);
      left.appendChild(clearSelectionButton);
      left.appendChild(packButton);

      const logo = document.createElement("img");
      logo.className = "packer-for-github-toolbar__logo";
      logo.alt = "Packer for GitHub Logo";

      toolbar.appendChild(logo);
      toolbar.appendChild(errors);
      toolbar.appendChild(status);
      toolbar.appendChild(left);
    }

    if (!toolbar.isConnected) {
      document.body.appendChild(toolbar);
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
      ? app.i18n.t('labels.clearAll')
      : app.i18n.t('labels.selectAll');
    toggleAllButton.disabled = isPacking || items.length === 0;
    clearSelectionButton.textContent = app.i18n.t('labels.clearSelection');
    clearSelectionButton.disabled = isPacking || !hasSelection;
    updatePackButtonContent(packButton, isPacking);
    packButton.disabled = !hasSelection; // Packing 狀態時不再禁用，因為要處理點擊中止
    
    status.textContent = isPacking ? packingMessage || app.i18n.t('messages.resolvingBranch') : getToolbarText(selectedCount);
    
    const errors = toolbar.querySelector('[data-role="error-report"]');
    if (errors) {
      const failedFiles = app.state.getFailedFiles();
      const lastError = app.state.getLastError();

      if (!isPacking && (failedFiles.length > 0 || lastError)) {
        renderToolbarErrors(errors, failedFiles, lastError);
      } else {
        errors.style.display = "none";
        errors.replaceChildren();
      }
    }
    
    const theme = getEffectiveTheme();
    const logo = toolbar.querySelector(".packer-for-github-toolbar__logo");
    if (logo) {
      // 根據 GitHub 主題決定 Logo (注意：Toolbar 目前採反差色設計)
      // GitHub 淺色 (theme=light) -> Toolbar 深色 -> 使用白色 Logo (logo_32_w)
      // GitHub 深色 (theme=dark) -> Toolbar 淺色 -> 使用黑色 Logo (logo_32_b)
      const logoFile = theme === "dark" ? "icons/logo_32_b.png" : "icons/logo_32_w.png";
      const logoUrl = getAssetUrl(logoFile);
      
      if (logoUrl) {
        logo.src = logoUrl;
        logo.style.display = "";
      } else {
        logo.style.display = "none";
      }
    }

    toolbar.classList.toggle(constants.loadingClassName, isPacking);
    toolbar.classList.toggle("packer-for-github-toolbar--visible", hasSelection || isPacking);
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

      const status = app.state.getSelectionStatus(item.path);
      checkbox.checked = status === "checked";
      checkbox.indeterminate = status === "indeterminate";
      markRowSelection(item.element, status !== "unchecked");
    });
  }

  function showPackResult(result) {
    if (!result) {
      return;
    }

    const notices = [];

    if (result.truncated) {
      notices.push(app.i18n.t('ui.truncatedNotice'));
    }

    if (result.missing && result.missing.length) {
      const preview = result.missing.slice(0, 6).join("\n");
      const suffix = result.missing.length > 6 ? app.i18n.t('ui.moreItems', {count: result.missing.length - 6}) : "";
      notices.push(app.i18n.t('ui.missingItemsNotice', {preview, suffix}));
    }

    if (notices.length) {
      window.alert(notices.join("\n\n"));
    }
  }

  app.ui = {
    ensureToolbar,
    ensureParentDirectorySpacer,
    insertCheckboxIntoRow,
    syncCheckboxes,
    syncToolbar,
    showPackResult
  };
})();
