// Copyright (c) 2024 iiPython

// Modules
const { app, BrowserWindow, ipcMain } = require("electron");
if (require("electron-squirrel-startup")) app.quit();

const TPLSmartDevice = require("tplink-lightbulb");
const path = require("node:path");

// Initialization
const source = path.join(__dirname, "src");

// Handle electron creation
const createWindow = async () => {

    // Setup and configure window
    const mainWindow = new BrowserWindow({
        width: 700,
        height: 400,
        webPreferences: {
            preload: path.join(source, "preload.js")
        }
    });

    mainWindow.setMenu(null);
    mainWindow.setResizable(false);
    mainWindow.setMaximizable(false);

    // Handle IPC
    let lastScan = null, foundBulbs = [];
    const sendBulbList = () => mainWindow.webContents.send("bulbs-found", foundBulbs.map(bulb => ({ host: bulb.host, name: bulb.name })));

    ipcMain.on("set-status", async (event, payload) => {
        const { h, s, b, on, host } = payload;
        await foundBulbs.find(bulb => bulb.ip === host).power(on, 0, {
            color_temp: 0,
            hue: h,
            saturation: s,
            brightness: b
        });
    });

    ipcMain.handle("get-status", async (event, host) => {
        let bulb = foundBulbs.find(bulb => bulb.ip === host);
        if (!bulb) {
            bulb = new TPLSmartDevice(host);
            foundBulbs.push(bulb);
        }
        
        return await bulb.info();
    });

    // Handle bulb scanning and selection
    ipcMain.on("get-light-bulbs", async () => {
        if (lastScan) lastScan.stop();

        console.log("[Scan] Scanning...");

        lastScan = TPLSmartDevice.scan();
        lastScan.on("light", (bulb) => {
            console.log("[Bulb Found]", bulb.host)
            if (!foundBulbs.find(b => b.host === bulb.host)) foundBulbs.push(bulb);
            sendBulbList();
        });

        sendBulbList();
    });

    // Load html
    mainWindow.loadFile(path.join(source, "index.html"));
}
app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});
app.on("window-all-closed", () => {
    if (process.platform !== 'darwin') app.quit();
});
