const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  // In development (when not packaged), start Next.js dev server URL
  const isDev = !app.isPackaged;
  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '.next', 'server', 'pages', 'index.html')}`;

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  // Enable logging from renderer process to main process console
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR'];
    const prefix = levels[level] || 'LOG';
    console.log(`[RENDERER ${prefix}] ${message}`);
  });

  win.loadURL(startURL);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Add handler to get component renderer config from JSON file
ipcMain.handle('get-renderer-config', async () => {
  const configPath = path.join(__dirname, 'constants', 'component_renderer_config.json');
  
  try {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Component renderer config file not found: ${configPath}`);
    }
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading component renderer config:', error);
    throw error; // Propagate error to renderer
  }
});

// IPC for opening DXF files
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'DXF Files', extensions: ['dxf'] }]
  });
  return { canceled: result.canceled, filePaths: result.filePaths };
});

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
  const parseScript = path.join(__dirname, 'parse_dxf.py');
  const { spawn } = require('child_process');
  
  // Find a Python executable with ezdxf
  const pythonCmd = findPythonExecutable();
  if (!pythonCmd) {
    throw new Error('Python executable not found for DXF parsing. Please make sure Python 3 with ezdxf is installed.');
  }
  
  // Build command arguments
  const args = [parseScript, filePath];
  
  // Add config if provided
  if (config) {
    args.push('--config', JSON.stringify(config));
  }
  
  console.log(`Running: ${pythonCmd} ${args.join(' ')}`);
  
  return new Promise((resolve, reject) => {
    let out = '', err = '';
    const proc = spawn(pythonCmd, args);
    
    proc.stdout.on('data', d => out += d.toString());
    proc.stderr.on('data', d => {
      err += d.toString();
      console.error(`DXF parsing error: ${d.toString()}`);
    });
    
    proc.on('close', code => {
      if (code === 0) {
        try {
          // Validate the output is valid JSON
          JSON.parse(out);
          resolve(out);
        } catch (e) {
          reject(`Failed to parse DXF output as JSON: ${e.message}`);
        }
      } else {
        reject(err || `parse_dxf.py exited with code ${code}`);
      }
    });
    
    // Handle process errors
    proc.on('error', (err) => {
      reject(`Failed to start Python process: ${err.message}`);
    });
  });
});