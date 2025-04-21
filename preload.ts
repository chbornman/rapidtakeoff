const { contextBridge, ipcRenderer } = require('electron');

// Expose file dialog and DXF parsing APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  openFileDialog: () => {
    console.log('[PRELOAD] Opening file dialog');
    return ipcRenderer.invoke('open-file-dialog');
  },
  parseDXFTree: (filePath: string, config?: any) => {
    console.log(`[PRELOAD] Parsing DXF file: ${filePath}`);
    console.log(`[PRELOAD] Using config:`, config);
    return ipcRenderer.invoke('parse-dxf-tree', filePath, config);
  },
  getRendererConfig: () => {
    console.log('[PRELOAD] Getting renderer config');
    return ipcRenderer.invoke('get-renderer-config');
  },
});