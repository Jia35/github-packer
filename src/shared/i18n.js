(function bootstrapI18n() {
  const app = (window.PackerForGitHub = window.PackerForGitHub || {});

  const dictionaries = {
    en: {
      labels: {
        selectAll: "Select All",
        clearAll: "Clear All",
        clearSelection: "Clear Selection",
        pack: "Pack & Download",
        preparing: "Preparing...",
        cancel: "Cancel Download",
        settings: "Set Token"
      },
      messages: {
        idle: "No items selected",
        resolvingBranch: "Resolving branch...",
        loadingTree: "Loading file tree...",
        matchingFiles: "Matching files...",
        downloadingFiles: "Downloading files...",
        buildingArchive: "Building ZIP...",
        completed: "Download started",
        privateRepoNotice: "Private repository. Please [Set GitHub Token] to continue.",
        authRequired: "Insufficient permissions. Check GitHub Token.",
        apiFailed: "GitHub API request failed: {status}{detail}",
        noTree: "Failed to fetch repository tree",
        noRepoContext: "Current GitHub repository info not found",
        noBranch: "Could not determine current branch",
        noFilesToDownload: "No files found to download: {preview}",
        allDownloadsFailed: "All downloads failed. Please check network or GitHub status.",
        downloadAborted: "Download aborted"
      },
      ui: {
        selectedItems: "Selected {count} items",
        failedDownload: "Some files failed to download:",
        abortedDownload: "Remaining files (canceled):",
        permissionDenied: "Permission Denied:",
        tokenExpired: " Private repo or token expired.",
        goToSettings: "Go to settings",
        errorOccurred: "Error occurred:",
        selectFolder: "Select Folder",
        selectFile: "Select File",
        moreItems: "...and {count} more items",
        truncatedNotice: "File tree truncated by GitHub. Some deep files might be missing.",
        missingItemsNotice: "Some items not found in current branch, skipped:\n{preview}{suffix}"
      },
      options: {
        title: "Packer for GitHub Settings",
        authTitle: "GitHub Authentication",
        authDesc: "Set Personal Access Token (PAT) to support private repositories.",
        tokenPlaceholder: "ghp_xxxxxxxxxxxx",
        toggleToken: "Show/Hide Token",
        generalTitle: "General Settings",
        languageLabel: "Display Language",
        save: "Save Settings",
        clear: "Clear",
        saved: "Settings saved!",
        refreshNotice: "Please refresh GitHub pages to apply changes.",
        infoTitle: "💡 Tips",
        info1: "Permissions (Fine-grained): Repository access <strong>All repositories</strong>, Permissions <strong>Contents</strong> (Read-only).",
        info2: "Privacy: Token is stored locally in <strong>chrome.storage</strong>. No data is sent to 3rd party servers.",
        info3: "GitHub Docs: ",
        infoLink: "How to create a Personal Access Token?",
        concurrencyLabel: "Concurrent Downloads",
        concurrencyHelp: "Number of files to download simultaneously. Larger values can speed up the process but may cause excessive network load or trigger GitHub API limits.",
        languages: {
          auto: "Follow Browser Language",
          zh_TW: "繁體中文",
          en: "English",
          ja: "日本語",
          ko: "한국어"
        }
      }
    },
    zh_TW: {
      labels: {
        selectAll: "全選",
        clearAll: "取消全選",
        clearSelection: "取消選取",
        pack: "打包下載",
        preparing: "準備中...",
        cancel: "中止下載",
        settings: "設定 Token"
      },
      messages: {
        idle: "尚未選取項目",
        resolvingBranch: "確認分支中...",
        loadingTree: "讀取檔案樹中...",
        matchingFiles: "整理選取項目中...",
        downloadingFiles: "下載檔案中...",
        buildingArchive: "建立 ZIP 中...",
        completed: "下載已開始",
        privateRepoNotice: "此為私有倉庫，請先 [設定 GitHub Token] 以繼續",
        authRequired: "權限不足，請檢查 GitHub Token 設定",
        apiFailed: "GitHub API 請求失敗：{status}{detail}",
        noTree: "無法取得儲存庫檔案樹",
        noRepoContext: "找不到目前的 GitHub 儲存庫資訊",
        noBranch: "無法判斷目前分支",
        noFilesToDownload: "找不到可下載的檔案：{preview}",
        allDownloadsFailed: "所有檔案均下載失敗，請檢查網路連線或 GitHub 狀態。",
        downloadAborted: "下載已中止"
      },
      ui: {
        selectedItems: "已選取 {count} 項",
        failedDownload: "部分檔案下載失敗：",
        abortedDownload: "尚未下載的檔案清單：",
        permissionDenied: "權限不足：",
        tokenExpired: " 此為私有倉庫或 Token 已過期。",
        goToSettings: "前往設定 GitHub Token",
        errorOccurred: "發生錯誤：",
        selectFolder: "選取資料夾",
        selectFile: "選取檔案",
        moreItems: "...以及另外 {count} 項",
        truncatedNotice: "這個儲存庫的檔案樹回傳結果被 GitHub 截斷，部分深層檔案可能未被包含。",
        missingItemsNotice: "部分項目在目前分支中找不到，已略過：\n{preview}{suffix}"
      },
      options: {
        title: "Packer for GitHub 設定",
        authTitle: "GitHub 認證設定",
        authDesc: "設定 Personal Access Token (PAT) 以支援下載私有儲存庫的內容。",
        tokenPlaceholder: "ghp_xxxxxxxxxxxx",
        toggleToken: "顯示/隱藏 Token",
        generalTitle: "一般設定",
        languageLabel: "顯示語言",
        save: "儲存設定",
        clear: "清除",
        saved: "設定已儲存！",
        refreshNotice: "請重新整理 GitHub 頁面以套用變更。",
        infoTitle: "💡 設定提示",
        info1: "必要權限 (Fine-grained)：Repository access 選擇 <strong>All repositories</strong>，Permissions 僅需勾選 <strong>Contents</strong> (Read-only) 即可。",
        info2: "隱私說明：此 Token 僅會儲存在您本地瀏覽器的 <strong>chrome.storage</strong> 中，不會傳送至任何第三方伺服器。",
        info3: "GitHub 官方文件：",
        infoLink: "如何建立 GitHub Personal Access Token？",
        concurrencyLabel: "下載併發數",
        concurrencyHelp: "同時下載的檔案數量。較大數值可加速，但可能導致網路壓力過大或觸發 GitHub API 限制。",
        footerPrefix: "© 2026 Packer for GitHub. ",
        languages: {
          auto: "跟隨瀏覽器語言",
          zh_TW: "繁體中文",
          en: "English",
          ja: "日本語",
          ko: "한국어"
        }
      }
    },
    ja: {
      labels: {
        selectAll: "すべて選択",
        clearAll: "すべて解除",
        clearSelection: "選択を解除",
        pack: "パックしてダウンロード",
        preparing: "準備中...",
        cancel: "ダウンロードを中止",
        settings: "トークンを設定"
      },
      messages: {
        idle: "項目が選択されていません",
        resolvingBranch: "ブランチを確認中...",
        loadingTree: "ファイルツリーを読み込み中...",
        matchingFiles: "ファイルを照合中...",
        downloadingFiles: "ファイルをダウンロード中...",
        buildingArchive: "ZIPを作成中...",
        completed: "ダウンロードを開始しました",
        privateRepoNotice: "プライベートリポジトリです。続行するには [GitHub Tokenを設定] してください。",
        authRequired: "権限が不足しています。GitHub Tokenの設定を確認してください。",
        apiFailed: "GitHub API リクエストが失敗しました：{status}{detail}",
        noTree: "リポジトリのファイルツリーを取得できませんでした",
        noRepoContext: "現在の GitHub リポジトリ情報が見つかりません",
        noBranch: "現在のブランチを特定できませんでした",
        noFilesToDownload: "ダウンロード可能なファイルが見つかりません：{preview}",
        allDownloadsFailed: "すべてのファイルのダウンロードに失敗しました。ネットワークまたは GitHub の状態を確認してください。",
        downloadAborted: "ダウンロードが中止されました"
      },
      ui: {
        selectedItems: "{count} 個の項目を選択済み",
        failedDownload: "一部のファイルのダウンロードに失敗しました：",
        abortedDownload: "未ダウンロードのファイルリスト：",
        permissionDenied: "権限がありません：",
        tokenExpired: " プライベートリポジトリか、トークンが期限切れです。",
        goToSettings: "GitHub Tokenの設定へ移動",
        errorOccurred: "エラーが発生しました：",
        selectFolder: "フォルダを選択",
        selectFile: "ファイルを選択",
        moreItems: "...さらに另外 {count} 項目",
        truncatedNotice: "GitHubによってファイルツリーが切り捨てられました。一部の深い階層のファイルが含まれていない可能性があります。",
        missingItemsNotice: "現在のブランチで見つからない項目があります。スキップされました：\n{preview}{suffix}"
      },
      options: {
        title: "Packer for GitHub 設定",
        authTitle: "GitHub 認証設定",
        authDesc: "プライベートリポジトリをサポートするために Personal Access Token (PAT) を設定します。",
        tokenPlaceholder: "ghp_xxxxxxxxxxxx",
        toggleToken: "トークンの表示/非表示",
        generalTitle: "一般設定",
        languageLabel: "表示言語",
        save: "設定を保存",
        clear: "クリア",
        saved: "設定を保存しました！",
        refreshNotice: "変更を適用するには GitHub ページを更新してください。",
        infoTitle: "💡 ヒント",
        info1: "必要な権限 (Fine-grained): Repository access は <strong>All repositories</strong>、Permissions は <strong>Contents</strong> (Read-only) を選択してください。",
        info2: "プライバシーについて: トークンはローカルの <strong>chrome.storage</strong> にのみ保存され、外部サーバーには送信されません。",
        info3: "GitHub ドキュメント: ",
        infoLink: "Personal Access Token の作成方法は？",
        concurrencyLabel: "同時ダウンロード数",
        concurrencyHelp: "同時にダウンロードするファイル数です。値を大きくすると速度は上がりますが、ネットワークへの負荷が増大したり、GitHub API の制限に達する可能性があります。",
        languages: {
          auto: "ブラウザの言語に従う",
          zh_TW: "繁體中文",
          en: "English",
          ja: "日本語",
          ko: "한국어"
        }
      }
    },
    ko: {
      labels: {
        selectAll: "모두 선택",
        clearAll: "모두 해제",
        clearSelection: "선택 해제",
        pack: "팩 및 다운로드",
        preparing: "준비 중...",
        cancel: "다운로드 취소",
        settings: "토큰 설정"
      },
      messages: {
        idle: "선택된 항목 없음",
        resolvingBranch: "브랜치 확인 중...",
        loadingTree: "파일 트리 로딩 중...",
        matchingFiles: "파일 매칭 중...",
        downloadingFiles: "파일 다운로드 중...",
        buildingArchive: "ZIP 생성 중...",
        completed: "다운로드 시작됨",
        privateRepoNotice: "비공개 저장소입니다. 계속하려면 [GitHub Token 설정] 하십시오.",
        authRequired: "권한이 부족합니다. GitHub Token 설정을 확인하십시오.",
        apiFailed: "GitHub API 요청 실패: {status}{detail}",
        noTree: "저장소 파일 트리를 가져오지 못했습니다",
        noRepoContext: "현재 GitHub 저장소 정보를 찾을 수 없습니다",
        noBranch: "현재 브랜치를 확인할 수 없습니다",
        noFilesToDownload: "다운로드할 파일을 찾을 수 없습니다: {preview}",
        allDownloadsFailed: "모든 파일 다운로드에 실패했습니다. 네트워크 또는 GitHub 상태를 확인하십시오.",
        downloadAborted: "다운로드가 중단되었습니다"
      },
      ui: {
        selectedItems: "{count}개 항목 선택됨",
        failedDownload: "일부 파일 다운로드 실패:",
        abortedDownload: "다운로드되지 않은 파일 목록:",
        permissionDenied: "권한 거부:",
        tokenExpired: " 비공개 저장소이거나 토큰이 만료되었습니다.",
        goToSettings: "GitHub Token 설정으로 이동",
        errorOccurred: "오류 발생:",
        selectFolder: "폴더 선택",
        selectFile: "파일 선택",
        moreItems: "...그 외 {count}개 항목",
        truncatedNotice: "GitHub에서 파일 트리가 잘렸습니다. 일부 깊은 경로의 파일이 누락되었을 수 있습니다.",
        missingItemsNotice: "현재 브랜치에서 찾을 수 없는 항목이 있습니다. 건너뜁니다:\n{preview}{suffix}"
      },
      options: {
        title: "Packer for GitHub 설정",
        authTitle: "GitHub 인증 설정",
        authDesc: "비공개 저장소를 지원하기 위해 Personal Access Token (PAT)을 설정합니다.",
        tokenPlaceholder: "ghp_xxxxxxxxxxxx",
        toggleToken: "토큰 표시/숨기기",
        generalTitle: "일반 설정",
        languageLabel: "표시 언어",
        save: "설정 저장",
        clear: "삭제",
        saved: "설정이 저장되었습니다!",
        refreshNotice: "변경 사항을 적용하려면 GitHub 페이지를 새로고침하십시오.",
        infoTitle: "💡 팁",
        info1: "필요한 권한 (Fine-grained): Repository access는 <strong>All repositories</strong>, Permissions는 <strong>Contents</strong> (Read-only)를 선택하십시오.",
        info2: "개인정보 보호: 토큰은 로컬 <strong>chrome.storage</strong>에만 저장되며 외부 서버로 전송되지 않습니다.",
        info3: "GitHub 문서: ",
        infoLink: "Personal Access Token 생성 방법은?",
        concurrencyLabel: "동시 다운로드 수",
        concurrencyHelp: "동시에 다운로드할 파일 수입니다. 값을 크게 하면 속도가 빨라지지만 네트워크 부하가 증가하거나 GitHub API 제한이 발생할 수 있습니다.",
        languages: {
          auto: "브라우저 언어 따르기",
          zh_TW: "繁體中文",
          en: "English",
          ja: "日本語",
          ko: "한국어"
        }
      }
    }
  };

  let currentLang = "en";

  function getEffectiveLanguage(pref) {
    if (pref && pref !== "auto") {
      return pref;
    }

    const navLang = (navigator.language || "en").toLowerCase();
    if (navLang.startsWith("zh")) return "zh_TW";
    if (navLang.startsWith("ja")) return "ja";
    if (navLang.startsWith("ko")) return "ko";
    
    return "en";
  }

  async function init() {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage) {
        currentLang = getEffectiveLanguage();
        resolve();
        return;
      }

      chrome.storage.local.get(["gh_packer_language"], (result) => {
        currentLang = getEffectiveLanguage(result.gh_packer_language);
        resolve();
      });
    });
  }

  function t(path, params = {}) {
    const keys = path.split(".");
    let value = dictionaries[currentLang];

    for (const key of keys) {
      if (!value || typeof value !== "object") {
        // Fallback to English
        value = dictionaries["en"];
        for (const k of keys) {
          value = value ? value[k] : null;
        }
        break;
      }
      value = value[key];
    }

    if (typeof value !== "string") {
      return path;
    }

    // Handle {key} replacements
    return value.replace(/{(\w+)}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  app.i18n = {
    init,
    t,
    getLanguage: () => currentLang
  };
})();
