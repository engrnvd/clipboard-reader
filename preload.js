const { ipcRenderer, clipboard } = require('electron')

window.ipcRenderer = ipcRenderer;
window.clipboard = clipboard;
window.electronAPI = {
    pasteItem: (text) => ipcRenderer.send('pasteItem', text),
    hideWindow: () => ipcRenderer.send('hideWindow')
}
