const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require("fs");

const { loadPyodide } = require("pyodide");

let pyodide;
let python_loaded = false;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    win.loadFile('app.html')
}

const setupPython = async () => {
    console.log("Setup python")

    pyodide = await loadPyodide();
    pyodide.FS.mount(pyodide.FS.filesystems.NODEFS, { root: app.getAppPath() + "/python" }, "/home/pyodide");

    pyodide.runPython(`
        print("hello from python")

        import sys
        sys.path.insert(1, 'modules/pint')
        from pint import UnitRegistry
        print("pint is loaded")

        sys.path.insert(1, 'modules')
        import numpy as np
        print("numpy is loaded")

        ureg = UnitRegistry()
        print("units are loaded")
    `)

    let hey = pyodide.runPython(`
    def hey(name):
        print('hey', name)
    hey
    `)

    // let hey = pyodide.globals.get('hey')
    hey("thomas!")

    hey.destroy()

    python_loaded = true;
    console.log("Python is loaded");
}

setupPython()

// const parse = (event, arg) => {
//     return pyodide.runPython(`
// input = str("""${arg}""")
// output_text, context, error = parse(input)
// output_text`)
// }

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
  