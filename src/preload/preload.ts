import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  fileOpen: () => ipcRenderer.invoke('file:open'),
  fileSave: (filePath: string, content: string) => ipcRenderer.invoke('file:save', filePath, content),
  fileSaveAs: (content: string, defaultPath?: string) => ipcRenderer.invoke('file:saveAs', content, defaultPath),
  fileRead: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  
  storeGet: (key: string) => ipcRenderer.invoke('store:get', key),
  storeSet: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
  storeGetStore: () => ipcRenderer.invoke('store:getStore'),
  
  newWindow: () => ipcRenderer.send('window:new'),
  closeWindow: () => ipcRenderer.send('window:close'),
  setTitle: (title: string) => ipcRenderer.send('window:setTitle', title),
  toggleMaximize: () => ipcRenderer.send('window:toggleMaximize'),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  exportPDF: (content: string, title: string) => ipcRenderer.invoke('file:exportPDF', content, title),
  
  // Custom hooks
  onWindowCloseRequest: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('window-close-request', subscription);
    return () => {
      ipcRenderer.removeListener('window-close-request', subscription);
    };
  },
  onMenuAction: (callback: (action: string) => void) => {
    const subscription = (_event: any, action: string) => callback(action);
    ipcRenderer.on('menu-action', subscription);
    return () => {
      ipcRenderer.removeListener('menu-action', subscription);
    };
  }
});
