// Copyright (c) 2024-2025 iiPython

// Modules
const { contextBridge, ipcRenderer } = require('electron/renderer')

// Handle bridging
contextBridge.exposeInMainWorld("_api", {
    setStatus: (payload) => ipcRenderer.send("set-status", payload),
    getStatus: (host) => ipcRenderer.invoke("get-status", host),
    getLightBulbs: (callback) => {
        ipcRenderer.send("get-light-bulbs");
        ipcRenderer.on("bulbs-found", (_e, bulbs) => callback(bulbs));
    }
});
