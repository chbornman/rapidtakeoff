const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const { findPythonExecutable } = require('./utils/dxf/python-executor');
const { parseDxfTree } = require('./utils/dxf/dxf-parser');
const { renderDxfToSvg } = require('./utils/dxf/svg-renderer');

// Track the main application window
let mainWindow = null;

// Define the path to the unified config file for use throughout the app
const configPath = path.join(__dirname, 'constants', 'component_renderer_config.json');

function createWindow() {
  // In development (when not packaged), start Next.js dev server URL
  const isDev = !app.isPackaged;
  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '.next', 'server', 'pages', 'index.html')}`;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  // Enable logging from renderer process to main process console
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR'];
    const prefix = levels[level] || 'LOG';
    console.log(`[RENDERER ${prefix}] ${message}`);
  });

  // Set up file watcher for the renderer config file (only in development)
  if (isDev) {
    setupConfigWatcher();
  }

  mainWindow.loadURL(startURL);
}

// Watch for changes to the renderer config file
function setupConfigWatcher() {
  console.log(`[MAIN] Setting up watcher for config file: ${configPath}`);
  
  const watcher = chokidar.watch(configPath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  watcher.on('change', (path) => {
    console.log(`[MAIN] Detected change in config file: ${path}`);
    // Notify the renderer process that the config has changed
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('config-file-changed');
    }
  });

  watcher.on('error', (error) => {
    console.error(`[MAIN] Error watching config file: ${error}`);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Add handler to get unified config from JSON file
ipcMain.handle('get-renderer-config', async () => {
  try {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading configuration:', error);
    throw error; // Propagate error to renderer
  }
});

// IPC for opening DXF files
// Cache to prevent duplicate file dialog openings
let fileDialogOpen = false;

ipcMain.handle('open-file-dialog', async () => {
  // Prevent multiple file dialogs from opening simultaneously
  if (fileDialogOpen) {
    console.log('[MAIN] File dialog already open, ignoring duplicate request');
    return { canceled: true, filePaths: [] };
  }
  
  console.log('[MAIN] Opening file dialog for DXF selection');
  fileDialogOpen = true;
  
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'DXF Files', extensions: ['dxf'] }]
    });
    console.log(`[MAIN] File dialog result: canceled=${result.canceled}, filePaths=${result.filePaths}`);
    return { canceled: result.canceled, filePaths: result.filePaths };
  } finally {
    // Reset flag when dialog closes (whether by selection or cancellation)
    fileDialogOpen = false;
  }
});

// IPC for rendering DXF to SVG
ipcMain.handle('render-svg', async (event, filePath, config = null) => {
  console.log(`[MAIN] Rendering SVG for DXF file: ${filePath}`);
  
  try {
    return await renderDxfToSvg(filePath, config);
  } catch (error) {
    console.error(`[MAIN] Error rendering SVG: ${error}`);
    throw error;
  }
});

// Handler to extract component tree from DXF
ipcMain.handle('parse-dxf-tree', async (event, filePath, config = null) => {
  console.log(`[MAIN] Parsing DXF tree for file: ${filePath}`);
  
  try {
    return await parseDxfTree(filePath, config);
  } catch (error) {
    console.error(`[MAIN] Error parsing DXF: ${error}`);
    throw error;
  }
});