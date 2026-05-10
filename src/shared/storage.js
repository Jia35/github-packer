(function bootstrapStorage() {
  const app = (window.PackerForGitHub = window.PackerForGitHub || {});

  const STORAGE_KEYS = {
    GITHUB_TOKEN: "gh_packer_token",
    LANGUAGE: "gh_packer_language",
    CONCURRENCY: "gh_packer_concurrency"
  };

  /**
   * Retrieves the GitHub token from storage.
   * @returns {Promise<string|null>}
   */
  async function getToken() {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage) {
        resolve(null);
        return;
      }

      chrome.storage.local.get([STORAGE_KEYS.GITHUB_TOKEN], (result) => {
        resolve(result[STORAGE_KEYS.GITHUB_TOKEN] || null);
      });
    });
  }

  /**
   * Saves the GitHub token to storage.
   * @param {string} token 
   * @returns {Promise<void>}
   */
  async function setToken(token) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage) {
        resolve();
        return;
      }

      chrome.storage.local.set({ [STORAGE_KEYS.GITHUB_TOKEN]: token }, () => {
        resolve();
      });
    });
  }

  /**
   * Validates if a token is syntactically valid (basic check).
   * @param {string} token 
   * @returns {boolean}
   */
  function isValidTokenFormat(token) {
    if (!token) return false;
    // GitHub PATs (classic) start with 'ghp_' and are 40 chars
    // Fine-grained PATs start with 'github_pat_'
    return /^ghp_[a-zA-Z0-9]{36}$/.test(token) || /^github_pat_[a-zA-Z0-9_]+$/.test(token);
  }

  /**
   * Retrieves the language preference.
   * @returns {Promise<string|null>}
   */
  async function getLanguagePreference() {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage) {
        resolve(null);
        return;
      }
      chrome.storage.local.get([STORAGE_KEYS.LANGUAGE], (result) => {
        resolve(result[STORAGE_KEYS.LANGUAGE] || "auto");
      });
    });
  }

  /**
   * Saves the language preference.
   * @param {string} lang 
   * @returns {Promise<void>}
   */
  async function setLanguagePreference(lang) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage) {
        resolve();
        return;
      }
      chrome.storage.local.set({ [STORAGE_KEYS.LANGUAGE]: lang }, () => {
        resolve();
      });
    });
  }

  /**
   * Retrieves the concurrency limit.
   * @returns {Promise<number>}
   */
  async function getConcurrencyLimit() {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage) {
        resolve(4);
        return;
      }
      chrome.storage.local.get([STORAGE_KEYS.CONCURRENCY], (result) => {
        const val = parseInt(result[STORAGE_KEYS.CONCURRENCY], 10);
        resolve(isNaN(val) ? 4 : val);
      });
    });
  }

  /**
   * Saves the concurrency limit.
   * @param {number} value 
   * @returns {Promise<void>}
   */
  async function setConcurrencyLimit(value) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage) {
        resolve();
        return;
      }
      const val = Math.max(1, Math.min(10, parseInt(value, 10) || 4));
      chrome.storage.local.set({ [STORAGE_KEYS.CONCURRENCY]: val }, () => {
        resolve();
      });
    });
  }

  app.storage = {
    getToken,
    setToken,
    isValidTokenFormat,
    getLanguagePreference,
    setLanguagePreference,
    getConcurrencyLimit,
    setConcurrencyLimit
  };
})();
