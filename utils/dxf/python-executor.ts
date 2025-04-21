import { spawn, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Find a valid Python executable with ezdxf installed
 */
export function findPythonExecutable(): string | null {
  // List of possible Python executable locations to try
  const candidates: string[] = [];
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
  return candidates.find(Boolean) || null;
}

/**
 * Execute a Python script with the given arguments
 */
export function executePythonScript(
  scriptPath: string, 
  args: string[], 
  config: any = null
): Promise<string> {
  console.log(`Executing Python script: ${scriptPath}`);
  
  // Find a Python executable with ezdxf
  const pythonCmd = findPythonExecutable();
  if (!pythonCmd) {
    console.error('No Python executable found with ezdxf module');
    return Promise.reject('Python executable not found. Please make sure Python 3 with ezdxf is installed.');
  }
  
  // Add config if provided
  const scriptArgs = [...args];
  if (config) {
    scriptArgs.push('--config', JSON.stringify(config));
  }
  
  console.log(`Running: ${pythonCmd} ${scriptPath} ${scriptArgs.join(' ')}`);
  
  return new Promise((resolve, reject) => {
    let out = '', err = '';
    const proc = spawn(pythonCmd, [scriptPath, ...scriptArgs]);
    
    proc.stdout.on('data', d => {
      const chunk = d.toString();
      out += chunk;
    });
    
    proc.stderr.on('data', d => {
      const errorMsg = d.toString();
      err += errorMsg;
      console.error(`Python error: ${errorMsg}`);
    });
    
    proc.on('close', code => {
      console.log(`Python process exited with code: ${code}`);
      
      if (code === 0) {
        resolve(out);
      } else {
        reject(err || `Python script exited with code ${code}`);
      }
    });
    
    // Handle process errors
    proc.on('error', (err) => {
      console.error(`Failed to start Python process: ${err.message}`);
      reject(`Failed to start Python process: ${err.message}`);
    });
  });
}