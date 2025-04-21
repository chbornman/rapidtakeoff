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
    width: 800,
    height: 600,
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

// Handler to extract component tree (lines, arcs, text) from DXF
ipcMain.handle('parse-dxf-tree', async (event, filePath) => {
  const parseScript = path.join(__dirname, 'parse_dxf.py');
  const { spawn, spawnSync } = require('child_process');
  const fs = require('fs');
  // Find a Python executable with ezdxf
  const candidates = [];
  const venvPy = path.join(__dirname, '.venv', 'bin', 'python3');
  if (fs.existsSync(venvPy)) candidates.push(venvPy);
  if (process.env.PYTHON) candidates.push(process.env.PYTHON);
  candidates.push('/opt/homebrew/bin/python3', '/usr/local/bin/python3', 'python3', 'python');
  let pythonCmd = null;
  for (const cmd of candidates) {
    try {
      const check = spawnSync(cmd, ['-c', 'import ezdxf'], { stdio: 'ignore' });
      if (check.status !== 0) continue;
      const impl = spawnSync(cmd, ['-c', 'import platform; print(platform.python_implementation())'], { stdio: ['ignore', 'pipe', 'ignore'] });
      if (impl.status === 0 && impl.stdout.toString().trim() === 'CPython') {
        pythonCmd = cmd;
        break;
      }
    } catch {}
  }
  if (!pythonCmd) pythonCmd = candidates.find(Boolean);
  if (!pythonCmd) {
    throw new Error('Python executable not found for DXF parsing');
  }
  return new Promise((resolve, reject) => {
    let out = '', err = '';
    const proc = spawn(pythonCmd, [parseScript, filePath]);
    proc.stdout.on('data', d => out += d.toString());
    proc.stderr.on('data', d => err += d.toString());
    proc.on('close', code => {
      if (code === 0) {
        resolve(out);
      } else {
        reject(err || `parse_dxf.py exited with code ${code}`);
      }
    });
  });
});