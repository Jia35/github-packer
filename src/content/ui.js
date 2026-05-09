(function bootstrapUi() {
  const app = (window.GitHubPacker = window.GitHubPacker || {});
  const constants = app.constants;

  const ICONS = {
    download: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 8px;"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"></path><path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"></path></svg>`,
    spinner: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="github-packer-spinner" style="margin-right: 8px;"><path d="M8 1.5a6.5 6.5 0 1 0 6.5 6.5.75.75 0 0 1 1.5 0 8 8 0 1 1-8-8 .75.75 0 0 1 0 1.5Z"></path></svg>`
  };

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

    target.classList.add("github-packer-inline-target");
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
      return constants.messages.idle;
    }

    return `已選取 ${itemCount} 項`;
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
    if (!items.length || !document.body) {
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

      const errors = document.createElement("div");
      errors.className = "github-packer-toolbar__errors";
      errors.dataset.role = "error-report";
      errors.style.display = "none";

      left.appendChild(selectAllButton);
      left.appendChild(clearSelectionButton);
      left.appendChild(packButton);

      const logo = document.createElement("img");
      logo.className = "github-packer-toolbar__logo";
      logo.alt = "GitHub Packer Logo";

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
      ? constants.labels.clearAll
      : constants.labels.selectAll;
    toggleAllButton.disabled = isPacking || items.length === 0;
    clearSelectionButton.textContent = constants.labels.clearSelection;
    clearSelectionButton.disabled = isPacking || !hasSelection;
    const label = isPacking ? constants.labels.preparing : constants.labels.pack;
    const icon = isPacking ? ICONS.spinner : ICONS.download;
    packButton.innerHTML = `${icon}<span>${label}</span>`;
    packButton.disabled = isPacking || !hasSelection;
    
    status.textContent = isPacking ? packingMessage || constants.messages.resolvingBranch : getToolbarText(selectedCount);
    
    const errors = toolbar.querySelector('[data-role="error-report"]');
    if (errors) {
      const failedFiles = app.state.getFailedFiles();
      const lastError = app.state.getLastError(); // Need to add this to state.js
      
      if (!isPacking && (failedFiles.length > 0 || lastError)) {
        let errorHtml = `<div style="color: var(--tp-error, #ff7b72); font-size: 13px; margin-bottom: 4px; line-height: 1.4;">`;
        
        if (lastError && (lastError.status === 401 || lastError.status === 404)) {
          errorHtml += `<strong>權限不足：</strong> 此為私有倉庫或 Token 已過期。<br/>`;
          errorHtml += `<a href="#" data-action="open-settings" style="color: #58a6ff; text-decoration: underline;">前往設定 GitHub Token</a>`;
        } else if (failedFiles.length > 0) {
          const threshold = 15;
          const visibleFailed = failedFiles.slice(0, threshold);
          const moreCount = failedFiles.length - threshold;
          
          errorHtml += `<strong>部分檔案下載失敗：</strong><br/>`;
          errorHtml += visibleFailed.map(f => `• ${f.split('/').pop()}`).join('<br/>');
          if (moreCount > 0) {
            errorHtml += `<br/>• ...以及另外 ${moreCount} 項`;
          }
        } else if (lastError) {
          errorHtml += `<strong>發生錯誤：</strong> ${lastError.message || "打包下載失敗"}`;
        }
        errorHtml += `</div>`;
        
        errors.innerHTML = errorHtml;
        errors.style.display = "block";

        const settingsLink = errors.querySelector('[data-action="open-settings"]');
        if (settingsLink) {
          settingsLink.addEventListener("click", (e) => {
            e.preventDefault();
            openOptionsPage();
          });
        }
      } else {
        errors.style.display = "none";
        errors.innerHTML = "";
      }
    }
    
    const theme = getEffectiveTheme();
    const logo = toolbar.querySelector(".github-packer-toolbar__logo");
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

  app.ui = {
    ensureToolbar,
    ensureParentDirectorySpacer,
    insertCheckboxIntoRow,
    syncCheckboxes,
    syncToolbar,
    showPackResult
  };
})();
