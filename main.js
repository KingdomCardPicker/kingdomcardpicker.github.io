const { app, BrowserWindow } = require('electron')
const ipc = require('electron').ipcMain;
const glob = require('glob')
const path = require('path')
const url = require('url')
const fs = require('fs')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected
let win;

function createWindow() {
    var files = glob.sync(path.join(__dirname, './app/scripts/main-process/**/*.js'));
    files.forEach(function (file) {
        require(file);
    });

    // Create the browser window
    win = new BrowserWindow({
        width: 600,
        height: 400,

        minWidth: 400,
        minHeight: 200,

        backgroundColor: '#ffffff',

        tite: "Kingdom",
        center: true,

        show: false
    });

    // Load the index.html of the app
    win.loadURL(url.format({
        pathname: path.join(__dirname, '/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    win.once('ready-to-show', () => {
        win.show();
        win.maximize();
        win.setMenuBarVisibility(false);
    });

    // Emitted when the window is closed
    win.on('closed', () => {
        // Dereference the window object
        win = null;
        app.quit();
    });
}

ipc.on('window-set-fullscreen', function (event, progressActive) {
    win.setFullScreen(true);
});

// Called when Electron has finished initialization
app.on('ready', createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});
