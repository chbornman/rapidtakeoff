const { contextBridge, ipcRenderer } = require('electron');

// Expose file dialog and DXF parsing APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  // Render DXF to SVG (with optional config)
  renderSVG: (filePath, config) => ipcRenderer.invoke('render-svg', filePath, config),
  // Parse DXF component tree (lines, arcs, text grouped by layer)
  parseDXFTree: (filePath) => ipcRenderer.invoke('parse-dxf-tree', filePath),
  // Get renderer configuration from JSON file
  getRendererConfig: () => ipcRenderer.invoke('get-renderer-config'),
});