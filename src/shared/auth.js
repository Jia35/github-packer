(function bootstrapAuth() {
  const app = (window.GitHubPacker = window.GitHubPacker || {});

  const STORAGE_KEYS = {
    GITHUB_TOKEN: "gh_packer_token"
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

  app.auth = {
    getToken,
    setToken,
    isValidTokenFormat
  };
})();
