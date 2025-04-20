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
// IPC for parsing DXF via Python script
ipcMain.handle('parse-dxf', async (event, filePath) => {
  const scriptPath = path.join(__dirname, 'parse_dxf.py');
  const { spawn, spawnSync } = require('child_process');
  // Auto-detect a Python executable that can import ezdxf
  const fs = require('fs');
  const candidates = [];
  // Virtual environment Python (if present)
  const venvPy = path.join(__dirname, '.venv', 'bin', 'python3');
  if (fs.existsSync(venvPy)) {
    candidates.push(venvPy);
  }
  // Honor PYTHON env override
  if (process.env.PYTHON) candidates.push(process.env.PYTHON);
  // Common brew/python3 paths
  candidates.push('/opt/homebrew/bin/python3', '/usr/local/bin/python3', 'python3', 'python');
  console.log('[parse-dxf] filePath =', filePath);
  console.log('[parse-dxf] Python candidates:', candidates);
  let pythonCmd;
  for (const cmd of candidates) {
    console.log(`[parse-dxf] testing python: ${cmd}`);
    try {
      const check = spawnSync(cmd, ['-c', 'import ezdxf'], { stdio: 'ignore' });
      console.log(`[parse-dxf] exit code for import ezdxf with ${cmd}:`, check.status);
      if (check.status === 0) {
        pythonCmd = cmd;
        console.log(`[parse-dxf] selected python: ${cmd}`);
        break;
      }
    } catch (e) {
      console.error(`[parse-dxf] error spawning ${cmd}:`, e.message);
    }
  }
  if (!pythonCmd) {
    pythonCmd = candidates.find(Boolean);
    console.warn('[parse-dxf] no python import ezdxf succeeded, falling back to', pythonCmd);
  }
  console.log(`[parse-dxf] using python executable: ${pythonCmd}`);
  // Log where ezdxf is loaded from
  try {
    const show = spawnSync(pythonCmd, ['-c', 'import ezdxf; print(ezdxf.__file__)'], { stdio: ['ignore', 'pipe', 'pipe'] });
    console.log('[parse-dxf] ezdxf module test exit code:', show.status);
    if (show.stdout) console.log('[parse-dxf] ezdxf __file__:', show.stdout.toString().trim());
    if (show.stderr) console.warn('[parse-dxf] ezdxf import stderr:', show.stderr.toString().trim());
  } catch (e) {
    console.error('[parse-dxf] error checking ezdxf module:', e.message);
  }
  return new Promise((resolve, reject) => {
    const proc = spawn(pythonCmd, [scriptPath, filePath]);
    let out = '';
    let err = '';
    proc.stdout.on('data', data => out += data.toString());
    proc.stderr.on('data', data => err += data.toString());
    proc.on('close', code => {
      if (code !== 0) {
        reject(err || `parse_dxf.py exited with code ${code}`);
      } else {
        try {
          const json = JSON.parse(out);
          resolve(json);
        } catch (e) {
          reject(e.message);
        }
      }
    });
  });
});