const {app, BrowserWindow, globalShortcut, clipboard, ipcMain} = require('electron');

let clipWindow
let previouslyFocusedApp = null

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

    clipWindow.loadFile('index.html')

    clipWindow.on('ready-to-show', () => {
        // Center the window
        clipWindow.center()
        clipWindow.show()
    })

    // Hide when window loses focus
    clipWindow.on('blur', () => clipWindow.hide())
}

async function checkAccessibilityPermissions() {
    const os = require('os')
    if (os.platform() === 'darwin') {
        const { execSync } = require('child_process')
        try {
            // Test if we have accessibility permissions
            execSync('osascript -e "tell application \\"System Events\\" to keystroke \\"v\\" using command down"', { encoding: 'utf8' })
            return true
        } catch (error) {
            await showPermissionsDialog()
        }
    }
    return true
}

async function showPermissionsDialog() {
    const { dialog } = require('electron')
    const { execSync } = require('child_process')

    const result = await dialog.showMessageBox({
        type: 'warning',
        title: 'Accessibility Permissions Required',
        message: 'This app needs accessibility permissions to paste text automatically.',
        detail: 'Please go to System Preferences → Security & Privacy → Privacy → Accessibility and add Clipboard Plus to the list.',
        buttons: ['Open System Preferences', 'Continue Without Auto-Paste', 'Quit'],
        defaultId: 0
    })

    if (result.response === 0) {
        // Open System Preferences
        execSync('open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"')
    } else if (result.response === 2) {
        app.quit()
        return false
    }
    return false
}

app.whenReady().then(async () => {
    createClipWindow()

    await checkAccessibilityPermissions()

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
})
// Handle item selection
ipcMain.on('pasteItem', (_, text) => {
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
                showPermissionsDialog()
            }
        }
    }, 100)
})

ipcMain.on('hideWindow', () => {
    clipWindow.hide()
})

app.on('window-all-closed', function () {
    app.quit();
})

if (process.env.NODE_ENV === 'dev') {
    require('electron-reload')(__dirname, {
        electron: require(`${__dirname}/node_modules/electron`)
    });
}

