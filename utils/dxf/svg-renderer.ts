import path from 'path';
import { executePythonScript } from './python-executor';

// Cache for running SVG render operations
const renderOperations = new Map<string, Promise<string>>();

/**
 * Render a DXF file to SVG format
 */
export async function renderDxfToSvg(
  filePath: string, 
  config: any = null
): Promise<string> {
  console.log(`Rendering SVG for DXF file: ${filePath}`);
  
  // Check if we're already rendering this file with same config
  const operationKey = `${filePath}-${JSON.stringify(config)}`;
  if (renderOperations.has(operationKey)) {
    console.log(`Already rendering this file with same config, returning existing promise`);
    return renderOperations.get(operationKey)!;
  }
  
  // Custom configuration - extract SVG parameters if it exists
  let effectiveConfig = config;
  if (config && typeof config === 'object') {
    // If there's a dedicated svg section in the config, use only that for render_dxf_svg.py
    if (config.svg) {
      console.log(`Using dedicated SVG config section with ${Object.keys(config.svg).length} parameters`);
      effectiveConfig = config.svg;
    }
  }
  
  const renderScript = path.join(process.cwd(), 'render_dxf_svg.py');
  
  const renderPromise = executePythonScript(renderScript, [filePath], effectiveConfig)
    .finally(() => {
      // Remove from operations map when done
      renderOperations.delete(operationKey);
    });
  
  // Store the promise in the operations map
  renderOperations.set(operationKey, renderPromise);
  
  return renderPromise;
}