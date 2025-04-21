const { contextBridge, ipcRenderer } = require('electron');

// Expose file dialog and DXF parsing APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  parseDXFTree: (filePath: string) => ipcRenderer.invoke('parse-dxf-tree', filePath),
  getRendererConfig: () => ipcRenderer.invoke('get-renderer-config'),
});