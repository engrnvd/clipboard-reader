# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run in development mode (with hot reload)
npm start

# Build for Linux
npm run linux-release

# Build for macOS
npm run mac-release

# Build for Windows
npm run windows-release
```

> When building for macOS, remove `electron-winstaller` from `package.json` dependencies first.

## Architecture

Clipboard Plus is an Electron desktop app — a floating clipboard history manager triggered by `Shift+Ctrl/Cmd+V`.

**Process model:**

- `main.js` — Electron main process. Registers the global shortcut, manages the `BrowserWindow`, polls nothing (clipboard reading happens in renderer). Handles two IPC messages: `pasteItem` (writes text to clipboard then uses AppleScript on macOS to activate the previous app and simulate Cmd+V) and `hideWindow`.
- `preload.js` — Exposes `window.clipboard`, `window.ipcRenderer`, and `window.electronAPI` to the renderer. `contextIsolation` is disabled.
- `index.html` — Renderer entry point. Loads Vue 2, Tailwind CSS, and Material Icons from CDNs. Mounts the Vue app from `assets/script.js`.
- `assets/script.js` — All renderer logic as a single Vue 2 instance. Polls `clipboard.readText()` every 1 second via `setInterval`. Stores items in `localStorage` as JSON under the key `clipboard-items`.

**Data model:**

Each clipboard item is `{ text: string, pinned: boolean }`. Items are stored as an array; recent (unpinned) items are capped at 20. Pinned items are never auto-removed.

**UI / keyboard shortcuts (handled in `assets/script.js`):**

| Key | Action |
|-----|--------|
| Arrow Up/Down | Navigate items |
| Arrow Left/Right | Switch tabs (Recent / Pinned) |
| Cmd/Ctrl + Arrow Right | Pin selected item |
| Cmd/Ctrl + Arrow Left | Unpin selected item |
| Enter | Paste selected item |
| Delete | Remove selected item |
| Escape | Hide window |

**macOS auto-paste flow:**

On `Shift+Cmd+V`, `main.js` records the frontmost app via AppleScript. When an item is pasted, it hides the window, writes text to the clipboard, re-activates the previous app, then simulates Cmd+V — all via `execSync` AppleScript calls. Linux/Windows get the clipboard written but no auto-paste.
