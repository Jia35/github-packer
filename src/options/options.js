(async function initOptions() {
  const app = window.PackerForGitHub;
  
  // Initialize i18n
  await app.i18n.init();
  const t = app.i18n.t;

  const tokenInput = document.getElementById("github-token");
  const saveButton = document.getElementById("save-button");
  const clearButton = document.getElementById("clear-button");
  const toggleButton = document.getElementById("toggle-token");
  const statusMessage = document.getElementById("status-message");
  const languageSelect = document.getElementById("language-select");
  const concurrencyRange = document.getElementById("concurrency-range");
  const concurrencyValue = document.getElementById("concurrency-value");

  const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap round="stroke-linejoin="round" class="icon-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const eyeOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-eye-off"><path d="M9.88 9.88 3.59 3.59"/><path d="M2 12s3-7 10-7a9 9 0 0 1 8.39 5.35"/><path d="M22 12s-3 7-10 7a9 9 0 0 1-5.61-2.02"/><path d="m17 17-6.41-6.41"/><path d="m21.21 21.21-18.42-18.42"/><circle cx="12" cy="12" r="3"/></svg>`;

  function translatePage() {
    document.title = t("options.title");
    document.getElementById("page-title").textContent = t("options.title");
    document.getElementById("auth-title").textContent = t("options.authTitle");
    document.getElementById("auth-desc").textContent = t("options.authDesc");
    document.getElementById("github-token").placeholder = t("options.tokenPlaceholder");
    document.getElementById("toggle-token").title = t("options.toggleToken");
    document.getElementById("save-button").textContent = t("options.save");
    document.getElementById("clear-button").textContent = t("options.clear");
    document.getElementById("general-title").textContent = t("options.generalTitle");
    document.getElementById("language-label").textContent = t("options.languageLabel");
    document.getElementById("concurrency-label").textContent = t("options.concurrencyLabel");
    document.getElementById("concurrency-desc").textContent = t("options.concurrencyHelp");
    document.getElementById("info-title").textContent = t("options.infoTitle");
    
    // Info list
    const info1 = document.getElementById("info-1");
    info1.innerHTML = t("options.info1");
    const info2 = document.getElementById("info-2");
    info2.innerHTML = t("options.info2");
    const info3 = document.getElementById("info-3");
    const infoLink = document.getElementById("info-link");
    info3.childNodes[0].textContent = t("options.info3");
    infoLink.textContent = t("options.infoLink");

    // Footer
    const footerText = document.getElementById("footer-text");
    footerText.childNodes[0].textContent = "© 2026 Packer for GitHub. ";
    
    // Language options
    const langOptions = languageSelect.options;
    for (let i = 0; i < langOptions.length; i++) {
      const val = langOptions[i].value;
      langOptions[i].textContent = t(`options.languages.${val}`);
    }
  }

  translatePage();

  toggleButton.addEventListener("click", () => {
    const isPassword = tokenInput.type === "password";
    tokenInput.type = isPassword ? "text" : "password";
    toggleButton.innerHTML = isPassword ? eyeOffIcon : eyeIcon;
  });

  concurrencyRange.addEventListener("input", () => {
    concurrencyValue.textContent = concurrencyRange.value;
  });

  // Load existing settings
  const [existingToken, existingLang, existingConcurrency] = await Promise.all([
    app.storage.getToken(),
    app.storage.getLanguagePreference(),
    app.storage.getConcurrencyLimit()
  ]);

  if (existingToken) {
    tokenInput.value = existingToken;
  }
  if (existingLang) {
    languageSelect.value = existingLang;
  }
  if (existingConcurrency) {
    concurrencyRange.value = existingConcurrency;
    concurrencyValue.textContent = existingConcurrency;
  }

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    if (type === "success") {
      setTimeout(() => {
        statusMessage.textContent = "";
        statusMessage.className = "status-message";
      }, 5000);
    }
  }

  saveButton.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    const lang = languageSelect.value;
    const concurrency = parseInt(concurrencyRange.value, 10);

    try {
      await Promise.all([
        app.storage.setToken(token || null),
        app.storage.setLanguagePreference(lang),
        app.storage.setConcurrencyLimit(concurrency)
      ]);
      
      // Update page language immediately if changed
      await app.i18n.init();
      translatePage();

      const savedMsg = t("options.saved");
      const refreshNotice = t("options.refreshNotice");
      showStatus(`${savedMsg} ${refreshNotice}`, "success");
    } catch (error) {
      showStatus(t("ui.errorOccurred") + " " + error.message, "error");
      console.error(error);
    }
  });

  clearButton.addEventListener("click", async () => {
    const confirmMsg = app.i18n.getLanguage() === "zh_TW" 
      ? "確定要清除儲存的 Token 嗎？這將導致無法下載私有儲存庫。"
      : "Are you sure you want to clear the saved token? This will prevent downloading private repositories.";
      
    if (confirm(confirmMsg)) {
      await app.storage.setToken(null);
      tokenInput.value = "";
      showStatus(t("options.clear") + " OK", "success");
    }
  });
})();
