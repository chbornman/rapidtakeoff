const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

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

// Cache for running DXF parse operations
const parseOperations = new Map();

// IPC for parsing DXF via Python script

// Helper to find a valid Python executable with ezdxf installed
const findPythonExecutable = () => {
  const { spawnSync } = require('child_process');
  const fs = require('fs');
  
  // List of possible Python executable locations to try
  const candidates = [];
  const venvPy = path.join(__dirname, '.venv', 'bin', 'python3');
  if (fs.existsSync(venvPy)) candidates.push(venvPy);
  if (process.env.PYTHON) candidates.push(process.env.PYTHON);
  candidates.push(
    '/opt/homebrew/bin/python3', 
    '/usr/local/bin/python3', 
    '/usr/bin/python3',
    'python3', 
    'python'
  );
  
  // Try each candidate
  for (const cmd of candidates) {
    try {
      // Check if ezdxf is available with this Python
      const check = spawnSync(cmd, ['-c', 'import ezdxf'], { stdio: 'ignore' });
      if (check.status !== 0) continue;
      
      // Verify it's CPython (not PyPy or other variant)
      const impl = spawnSync(cmd, ['-c', 'import platform; print(platform.python_implementation())'], 
                            { stdio: ['ignore', 'pipe', 'ignore'] });
      if (impl.status === 0 && impl.stdout.toString().trim() === 'CPython') {
        console.log(`Found valid Python executable: ${cmd}`);
        return cmd;
      }
    } catch (e) {
      console.log(`Error checking Python executable ${cmd}: ${e.message}`);
    }
  }
  
  // Fallback to any executable we found
  return candidates.find(Boolean);
};

// Handler to extract component tree from DXF
ipcMain.handle('parse-dxf-tree', async (event, filePath, config = null) => {
  console.log(`[MAIN] Parsing DXF tree for file: ${filePath}`);
  
  // Check if we're already parsing this file
  const operationKey = `${filePath}-${JSON.stringify(config)}`;
  if (parseOperations.has(operationKey)) {
    console.log(`[MAIN] Already parsing this file with same config, returning existing promise`);
    return parseOperations.get(operationKey);
  }
  
  console.log('[MAIN] DXF parsing config:', config);
  
  const parseScript = path.join(__dirname, 'parse_dxf.py');
  const { spawn } = require('child_process');
  
  // Find a Python executable with ezdxf
  console.log('[MAIN] Finding Python executable with ezdxf');
  const pythonCmd = findPythonExecutable();
  if (!pythonCmd) {
    console.error('[MAIN] No Python executable found with ezdxf module');
    throw new Error('Python executable not found for DXF parsing. Please make sure Python 3 with ezdxf is installed.');
  }
  console.log(`[MAIN] Found Python executable: ${pythonCmd}`);
  
  // Build command arguments
  const args = [parseScript, filePath];
  
  // Add config if provided
  if (config) {
    args.push('--config', JSON.stringify(config));
  }
  
  console.log(`[MAIN] Running: ${pythonCmd} ${args.join(' ')}`);
  
  const parsePromise = new Promise((resolve, reject) => {
    let out = '', err = '';
    const proc = spawn(pythonCmd, args);
    console.log(`[MAIN] Python process spawned with PID: ${proc.pid}`);
    
    proc.stdout.on('data', d => {
      const chunk = d.toString();
      console.log(`[MAIN] Received ${chunk.length} bytes from Python stdout`);
      out += chunk;
    });
    
    proc.stderr.on('data', d => {
      const errorMsg = d.toString();
      err += errorMsg;
      console.error(`[MAIN] DXF parsing error: ${errorMsg}`);
    });
    
    proc.on('close', code => {
      console.log(`[MAIN] Python process exited with code: ${code}`);
      // Remove from operations map when done
      parseOperations.delete(operationKey);
      
      if (code === 0) {
        try {
          // Validate the output is valid JSON
          console.log(`[MAIN] Validating JSON output (${out.length} bytes)`);
          JSON.parse(out);
          console.log('[MAIN] Successfully parsed DXF data as JSON');
          resolve(out);
        } catch (e) {
          console.error('[MAIN] Failed to parse output as JSON:', e);
          reject(`Failed to parse DXF output as JSON: ${e.message}`);
        }
      } else {
        console.error(`[MAIN] Python process failed with code ${code}`);
        reject(err || `parse_dxf.py exited with code ${code}`);
      }
    });
    
    // Handle process errors
    proc.on('error', (err) => {
      console.error(`[MAIN] Failed to start Python process: ${err.message}`);
      // Remove from operations map on error
      parseOperations.delete(operationKey);
      reject(`Failed to start Python process: ${err.message}`);
    });
  });
  
  // Store the promise in the operations map
  parseOperations.set(operationKey, parsePromise);
  
  return parsePromise;
});