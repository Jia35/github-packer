# GitHub Packer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A browser extension that allows you to selectively pick files and folders from any GitHub repository and download them as a single ZIP archive. No more cloning entire repositories just for a few files.

[繁體中文版](./README.zh-TW.md)

## ✨ Key Features

- **Selective Download**: Choose exactly what you need with per-row checkboxes in the GitHub file tree.
- **Folder Support**: Select entire directories and their contents are automatically included.
- **Private Repo Support**: Full support for private repositories using a GitHub Personal Access Token (PAT).
- **In-Browser Compression**: ZIP files are generated entirely within your browser for speed and privacy.
- **SPA Compatibility**: Seamlessly works with GitHub's client-side navigation (Single Page Application).
- **Secure Storage**: Your PAT is stored locally in `chrome.storage` and never sent to external servers.

## 🚀 Installation (Development)

Currently, GitHub Packer is in development. You can load it manually:

1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top right corner).
4. Click **Load unpacked** and select the project folder.

## ⚙️ Configuration (Optional for Private Repos)

To download files from private repositories, you need to set up a Personal Access Token:

1. Go to [GitHub Token Settings](https://github.com/settings/tokens?type=beta).
2. Generate a new **Fine-grained Personal Access Token**.
3. Set **Repository access** to "All repositories" (or specific ones).
4. Set **Permissions** -> **Contents** to "Read-only".
5. Copy the token.
6. Open the **GitHub Packer Options** (Right-click extension icon -> Options).
7. Paste your token and save.

## 🛡️ Privacy & Security

We take your security seriously:
- **Zero External Tracking**: No analytics or external API calls (other than GitHub API).
- **Local Storage**: All credentials and settings stay in your browser.
- **Open Source**: The code is transparent and auditable.
