import path from 'path';
import { executePythonScript } from './python-executor';

// Cache for running DXF parse operations
const parseOperations = new Map<string, Promise<string>>();

/**
 * Parse a DXF file and extract its structure
 */
export async function parseDxfTree(
  filePath: string, 
  config: any = null
): Promise<string> {
  console.log(`Parsing DXF tree for file: ${filePath}`);
  
  // Check if we're already parsing this file
  const operationKey = `${filePath}-${JSON.stringify(config)}`;
  if (parseOperations.has(operationKey)) {
    console.log(`Already parsing this file with same config, returning existing promise`);
    return parseOperations.get(operationKey)!;
  }
  
  const parseScript = path.join(process.cwd(), 'parse_dxf.py');
  
  const parsePromise = executePythonScript(parseScript, [filePath], config)
    .then(out => {
      try {
        // Validate the output is valid JSON
        console.log(`Validating JSON output (${out.length} bytes)`);
        JSON.parse(out);
        console.log('Successfully parsed DXF data as JSON');
        return out;
      } catch (e) {
        console.error('Failed to parse output as JSON:', e);
        throw new Error(`Failed to parse DXF output as JSON: ${e.message}`);
      }
    })
    .finally(() => {
      // Remove from operations map when done
      parseOperations.delete(operationKey);
    });
  
  // Store the promise in the operations map
  parseOperations.set(operationKey, parsePromise);
  
  return parsePromise;
}