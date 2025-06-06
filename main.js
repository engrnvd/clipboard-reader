const {app, BrowserWindow, globalShortcut, clipboard, ipcMain} = require('electron');

let mainWindow
let clipWindow
let previouslyFocusedApp = null

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1080,
        height: 720,
        backgroundColor: '#ffffff',
        icon: `file://${__dirname}/assets/icon.png`,
        webPreferences: {
            preload: `${__dirname}/preload.js`
        }
    });

    mainWindow.loadURL(`file://${__dirname}/index.html`);

    if (process.env.NODE_ENV === 'dev') {
        mainWindow.webContents.openDevTools();
    }

    // Event when the window is closed.
    mainWindow.on('closed', function () {
        mainWindow = null
    });
}

function createClipWindow() {
    clipWindow = new BrowserWindow({
        width: 400,
        height: 300,
        alwaysOnTop: true,
        frame: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            preload: `${__dirname}/preload.js`,
            contextIsolation: false
        }
    })

    clipWindow.loadFile('clip.html')

    clipWindow.on('ready-to-show', () => {
        // Center the window
        clipWindow.center()
        clipWindow.show()
    })

    // Hide when window loses focus
    clipWindow.on('blur', () => clipWindow.hide())
}

app.whenReady().then(() => {
    createWindow()
    createClipWindow()

    // Register global shortcut
    globalShortcut.register('Shift+CommandOrControl+V', (e) => {
        // Store the currently focused application before showing our window
        const { execSync } = require('child_process')
        const os = require('os')

        if (os.platform() === 'darwin') {
            try {
                // Get the frontmost application
                const result = execSync('osascript -e "tell application \\"System Events\\" to get name of first application process whose frontmost is true"', { encoding: 'utf8' })
                previouslyFocusedApp = result.trim()
                console.log('Previously focused app:', previouslyFocusedApp)
            } catch (error) {
                console.error('Could not get focused app:', error)
            }
        }

        if (clipWindow.isDestroyed()) createClipWindow()
        clipWindow.show()
        clipWindow.focus()
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})
// Handle item selection
ipcMain.on('paste-item', (_, text) => {
    console.log({text})
    clipWindow.hide()
    clipboard.writeText(text)

    setTimeout(() => {
        const { execSync } = require('child_process')
        const os = require('os')

        if (os.platform() === 'darwin') {
            try {
                // First, activate the previously focused application
                if (previouslyFocusedApp) {
                    execSync(`osascript -e "tell application \\"${previouslyFocusedApp}\\" to activate"`)

                    // Small delay to ensure app is activated
                    setTimeout(() => {
                        // Now paste the content
                        execSync('osascript -e "tell application \\"System Events\\" to keystroke \\"v\\" using command down"')
                    }, 100)
                } else {
                    // Fallback: just paste (might not work if no app is focused)
                    execSync('osascript -e "tell application \\"System Events\\" to keystroke \\"v\\" using command down"')
                }
            } catch (error) {
                console.error('Paste error:', error)
            }
        }
    }, 100)
})

app.on('window-all-closed', function () {
    app.quit();
})

app.on('activate', function () {
    // macOS specific close process
    if (mainWindow === null) {
        createWindow();
    }
})

if (process.env.NODE_ENV === 'dev') {
    require('electron-reload')(__dirname, {
        electron: require(`${__dirname}/node_modules/electron`)
    });
}

