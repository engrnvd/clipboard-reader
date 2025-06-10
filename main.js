const {app, BrowserWindow, globalShortcut, clipboard, ipcMain, screen } = require('electron');

let clipWindow
let previouslyFocusedApp = null
let targetDisplay = null // Store the display where the focused app was

function createClipWindow() {
    const { screen } = require('electron')
    const primaryDisplay = screen.getPrimaryDisplay()
    const { height: screenHeight } = primaryDisplay.workAreaSize

    clipWindow = new BrowserWindow({
        width: 400,
        height: screenHeight - 100,
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

function positionClipboardWindow() {
    if (!clipWindow) return

    const { screen } = require('electron')

    // Use target display if available, otherwise use primary display
    const display = targetDisplay || screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight, x: screenX, y: screenY } = display.workArea

    const windowWidth = 400
    const windowHeight = screenHeight - 100

    // Center the window on the target screen
    const x = screenX + Math.round((screenWidth - windowWidth) / 2)
    const y = screenY + Math.round((screenHeight - windowHeight) / 2)

    clipWindow.setBounds({
        x: x,
        y: y,
        width: windowWidth,
        height: windowHeight
    })

    console.log(`Positioned clipboard window at ${x}, ${y} on display ${display.id}`)
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
        const { screen } = require('electron')
        const cursorPoint = screen.getCursorScreenPoint()
        targetDisplay = screen.getDisplayNearestPoint(cursorPoint)

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

        if (!clipWindow) createClipWindow()
        else positionClipboardWindow()
        positionClipboardWindow()

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

