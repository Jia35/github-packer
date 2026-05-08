# GitHub Packer

Chrome extension prototype for selecting files or folders from a GitHub repository page and preparing them for packaging.

## Phase 1 scope

- Inject per-row checkboxes into GitHub repository file lists
- Add a toolbar with `全選` and `打包下載`
- Track selections across GitHub SPA navigation
- Re-render controls when the file list changes

The actual repository tree expansion and ZIP download flow is intentionally left for phase 2.

## Load locally

1. Open `chrome://extensions`
2. Enable developer mode
3. Choose `Load unpacked`
4. Select this folder
