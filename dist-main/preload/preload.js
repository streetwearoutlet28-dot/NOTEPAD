"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    fileOpen: () => electron_1.ipcRenderer.invoke('file:open'),
    fileSave: (filePath, content) => electron_1.ipcRenderer.invoke('file:save', filePath, content),
    fileSaveAs: (content, defaultPath) => electron_1.ipcRenderer.invoke('file:saveAs', content, defaultPath),
    fileRead: (filePath) => electron_1.ipcRenderer.invoke('file:read', filePath),
    storeGet: (key) => electron_1.ipcRenderer.invoke('store:get', key),
    storeSet: (key, value) => electron_1.ipcRenderer.invoke('store:set', key, value),
    storeGetStore: () => electron_1.ipcRenderer.invoke('store:getStore'),
    newWindow: () => electron_1.ipcRenderer.send('window:new'),
    closeWindow: () => electron_1.ipcRenderer.send('window:close'),
    setTitle: (title) => electron_1.ipcRenderer.send('window:setTitle', title),
    toggleMaximize: () => electron_1.ipcRenderer.send('window:toggleMaximize'),
    openExternal: (url) => electron_1.ipcRenderer.invoke('shell:openExternal', url),
    exportPDF: (content, title) => electron_1.ipcRenderer.invoke('file:exportPDF', content, title),
    // Custom hooks
    onWindowCloseRequest: (callback) => {
        const subscription = () => callback();
        electron_1.ipcRenderer.on('window-close-request', subscription);
        return () => {
            electron_1.ipcRenderer.removeListener('window-close-request', subscription);
        };
    },
    onMenuAction: (callback) => {
        const subscription = (_event, action) => callback(action);
        electron_1.ipcRenderer.on('menu-action', subscription);
        return () => {
            electron_1.ipcRenderer.removeListener('menu-action', subscription);
        };
    }
});
