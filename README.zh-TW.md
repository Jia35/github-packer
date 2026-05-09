# Packer for GitHub

[![授權條款: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Packer for GitHub 是一個瀏覽器擴充功能，讓你能夠從任何 GitHub 儲存庫中，自由挑選特定的檔案或資料夾，並直接打包成一個 ZIP 壓縮檔下載。從此不再需要為了幾個檔案而 Clone 整個儲存庫。

[English Version](./README.md)

## ✨ 核心特色

- **選取下載**：在 GitHub 檔案清單中直接勾選你需要的檔案或資料夾。
- **資料夾支援**：支援勾選整個目錄，自動包含其所有子內容。
- **私有儲存庫支援**：透過 GitHub Personal Access Token (PAT) 完整支援私有儲存庫。
- **瀏覽器端壓縮**：所有 ZIP 壓縮作業皆在您的瀏覽器中完成，快速且保護隱私。
- **相容 SPA 導覽**：完美相容 GitHub 的單頁面應用 (SPA) 導覽，切換路徑也不會失效。
- **安全儲存**：您的 PAT 僅儲存於本地 `chrome.storage`，絕不會傳送到第三方伺服器。

## 🚀 安裝方式 (開發版)

目前 Packer for GitHub 仍在開發階段，您可以手動載入：

1. 下載或 Clone 本儲存庫。
2. 開啟 Chrome 瀏覽器並前往 `chrome://extensions`。
3. 開啟右上角的 **「開發者模式」**。
4. 點擊 **「載入未封裝項目」** 並選擇此專案資料夾。

## ⚙️ 相關設定 (下載私有儲存庫時選用)

若要下載私有儲存庫的內容，您需要設定 Personal Access Token：

1. 前往 [GitHub Token 設定頁面](https://github.com/settings/tokens?type=beta)。
2. 建立一個新的 **Fine-grained Personal Access Token**。
3. **Repository access** 選擇 "All repositories" (或特定儲存庫)。
4. **Permissions** -> **Contents** 設定為 "Read-only"。
5. 複製產生的 Token。
6. 開啟 **Packer for GitHub 設定頁面** (右鍵點擊擴充功能圖示 -> 選項)。
7. 貼上您的 Token 並儲存。

## 🛡️ 隱私與安全

我們非常重視您的安全性：
- **無外部追蹤**：除了呼叫 GitHub API 外，無任何分析工具或外部請求。
- **本地儲存**：所有憑證與設定均保留在您的瀏覽器中。
- **程式碼開源**：程式碼完全透明，可隨時進行審查。
