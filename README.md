# GitHub Packer

Chrome extension prototype for selecting files or folders from a GitHub repository page and downloading them as a ZIP archive.

## Current scope

- Inject per-row checkboxes into GitHub repository file lists
- Add a toolbar with `全選` and `打包下載`
- Track selections across GitHub SPA navigation
- Re-render controls when the file list changes
- Resolve selected files and folders against the current branch
- Download file contents from GitHub and build a ZIP in the browser
- Trigger a local ZIP download for the selected items

## Load locally

1. Open `chrome://extensions`
2. Enable developer mode
3. Choose `Load unpacked`
4. Select this folder
