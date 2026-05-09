(async function initOptions() {
  const tokenInput = document.getElementById("github-token");
  const saveButton = document.getElementById("save-button");
  const clearButton = document.getElementById("clear-button");
  const statusMessage = document.getElementById("status-message");

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
