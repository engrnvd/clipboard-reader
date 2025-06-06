const { ipcRenderer, clipboard } = require('electron')

window.ipcRenderer = ipcRenderer;
window.clipboard = clipboard;
window.electronAPI = {
    sendItem: (text) => ipcRenderer.send('paste-item', text),
    getHistory: () => ipcRenderer.invoke('get-history')
}
