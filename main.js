const { app, BrowserWindow, globalShortcut } = require("electron");
const register = require("./antler_modules/register");
const fs = require("fs");

let win;

function createWindow (htmlFilePath) {
    win = new BrowserWindow({ width: 800, height: 600, frame: false })


    win.loadFile(htmlFilePath);


    win.on('closed', () => {

    win = null
    })
}





//----------------------------------------------------------------------------


app.on('ready', () => {
    
    if(fs.existsSync("./metaData.json")) {
        createWindow("src/index.html")
    } else {
        createWindow("src/setup.html")
    }

    //TODO remove on launch
    globalShortcut.register("CommandOrControl+Q", () => {
      win.webContents.openDevTools();
    });
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})
