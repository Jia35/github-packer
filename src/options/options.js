(async function initOptions() {
  const tokenInput = document.getElementById("github-token");
  const saveButton = document.getElementById("save-button");
  const clearButton = document.getElementById("clear-button");
  const toggleButton = document.getElementById("toggle-token");
  const statusMessage = document.getElementById("status-message");

  const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const eyeOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-eye-off"><path d="M9.88 9.88 3.59 3.59"/><path d="M2 12s3-7 10-7a9 9 0 0 1 8.39 5.35"/><path d="M22 12s-3 7-10 7a9 9 0 0 1-5.61-2.02"/><path d="m17 17-6.41-6.41"/><path d="m21.21 21.21-18.42-18.42"/><circle cx="12" cy="12" r="3"/></svg>`;

  toggleButton.addEventListener("click", () => {
    const isPassword = tokenInput.type === "password";
    tokenInput.type = isPassword ? "text" : "password";
    toggleButton.innerHTML = isPassword ? eyeOffIcon : eyeIcon;
  });

  // Load existing token
  const existingToken = await window.GitHubPacker.auth.getToken();
  if (existingToken) {
    tokenInput.value = existingToken;
  }

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    if (type === "success") {
      setTimeout(() => {
        statusMessage.textContent = "";
        statusMessage.className = "status-message";
      }, 3000);
    }
  }

  saveButton.addEventListener("click", async () => {
    const token = tokenInput.value.trim();

    if (!token) {
      showStatus("請輸入 Token", "error");
      return;
    }

    if (!window.GitHubPacker.auth.isValidTokenFormat(token)) {
      showStatus("Token 格式看起來不正確 (應為 ghp_ 或 github_pat_ 開頭)", "error");
      // Continue anyway as formats might change, but warn the user
    }

    try {
      await window.GitHubPacker.auth.setToken(token);
      showStatus("設定已成功儲存！", "success");
    } catch (error) {
      showStatus("儲存失敗，請重試", "error");
      console.error(error);
    }
  });

  clearButton.addEventListener("click", async () => {
    if (confirm("確定要清除儲存的 Token 嗎？這將導致無法下載私有儲存庫。")) {
      await window.GitHubPacker.auth.setToken(null);
      tokenInput.value = "";
      showStatus("Token 已清除", "success");
    }
  });
})();
