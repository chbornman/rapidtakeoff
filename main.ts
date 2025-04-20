const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

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

  win.loadURL(startURL);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
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

// IPC for rendering DXF to SVG via Python script
ipcMain.handle('render-svg', async (event, filePath, config = {}) => {
  const renderScript = path.join(__dirname, 'render_dxf_svg.py');
  const { spawn, spawnSync } = require('child_process');
  const fs = require('fs');
  // Find a Python executable
  const candidates = [];
  const venvPy = path.join(__dirname, '.venv', 'bin', 'python3');
  if (fs.existsSync(venvPy)) candidates.push(venvPy);
  if (process.env.PYTHON) candidates.push(process.env.PYTHON);
  candidates.push('/opt/homebrew/bin/python3', '/usr/local/bin/python3', 'python3', 'python');
  let pythonCmd = null;
  for (const cmd of candidates) {
    try {
      // Test import ezdxf
      const check = spawnSync(cmd, ['-c', 'import ezdxf'], { stdio: 'ignore' });
      if (check.status !== 0) continue;
      // Verify CPython implementation
      const impl = spawnSync(cmd, ['-c', 'import platform; print(platform.python_implementation())'], { stdio: ['ignore', 'pipe', 'ignore'] });
      if (impl.status === 0 && impl.stdout.toString().trim() === 'CPython') {
        pythonCmd = cmd;
        break;
      }
    } catch {}
  }
  if (!pythonCmd) pythonCmd = candidates.find(Boolean);
  return new Promise((resolve, reject) => {
    // Render to SVG via Python Add-on with config
    let out = '', err = '';
    const configStr = JSON.stringify(config);
    const args = [renderScript, filePath];
    
    // Add config if provided
    if (Object.keys(config).length > 0) {
      // Debug log to see what config is being sent - using both console methods
      console.log('Rendering with config:', configStr);
      console.warn('CONFIG DEBUG:', JSON.stringify(config, null, 2));
      
      args.push('--config');
      args.push(configStr);
    }
    
    const proc = spawn(pythonCmd, args);
    proc.stdout.on('data', d => out += d.toString());
    proc.stderr.on('data', d => err += d.toString());
    proc.on('close', code => {
      if (code === 0) {
        resolve(out);
      } else {
        reject(err || `render_dxf_svg.py exited with code ${code}`);
      }
    });
  });
});