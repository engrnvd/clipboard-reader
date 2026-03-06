const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
    .then(createWindowsInstaller)
    .catch((error) => {
        console.error(error.message || error)
        process.exit(1)
    })

function getInstallerConfig() {
    const rootPath = path.join('.');
    const projectName = path.basename(__dirname);
    const config = {
        appDirectory: path.join(rootPath, 'release-builds', `${projectName}-win32-ia32`),
        authors: 'Naveed ul Hassan Malik',
        noMsi: true,
        outputDirectory: path.join(rootPath, 'builds'),
        exe: `${projectName}.exe`,
        setupExe: `${projectName}.exe`,
        setupIcon: path.join(rootPath, 'assets', 'icon.ico')
    };
    return Promise.resolve(config);
}
