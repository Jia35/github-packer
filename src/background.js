chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openOptionsPage") {
    chrome.runtime.openOptionsPage();
  }
});

// 當點擊擴充功能圖示時，直接開啟設定頁面
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
