const {app, BrowserWindow} = require('electron');

let win;

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1080,
        height: 720,
        backgroundColor: '#ffffff',
        icon: `file://${__dirname}/assets/icon.png`
    });

    win.loadURL(`file://${__dirname}/index.html`);

    //// uncomment below to open the DevTools.
    // win.webContents.openDevTools()

    // Event when the window is closed.
    win.on('closed', function () {
        win = null
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    app.quit();
})

app.on('activate', function () {
    // macOS specific close process
    if (win === null) {
        createWindow();
    }
})
