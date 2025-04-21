const { contextBridge, ipcRenderer } = require('electron');

// Expose file dialog and DXF parsing APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  parseDXFTree: (filePath: string, config?: any) => ipcRenderer.invoke('parse-dxf-tree', filePath, config),
  getRendererConfig: () => ipcRenderer.invoke('get-renderer-config'),
});