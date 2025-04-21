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
      console.log(`Rendering mode: ${config.renderingMode}`);
      
      // Add a timestamp to force cache invalidation when switching renderers
      const timestamp = Date.now();
      
      // Check if we're using component-based or ezdxf rendering
      if (config.renderingMode === 'component') {
        // Force wireframe settings for component-based rendering
        const svgConfig = {
          ...config.svg,
          fill_policy: "NONE",
          lwpolyline_fill: false,
          polyline_fill: false,
          hatch_policy: "OUTLINE",
          _timestamp: timestamp // Add timestamp to prevent caching
        };
        effectiveConfig = svgConfig;
      } else {
        // Use ezdxf Drawing add-on configuration
        const svgConfig = {
          ...config.svg,
          // Use provided config but ensure ezdxf rendering settings
          pdsize: config.svg.pdsize ?? null,
          pdmode: config.svg.pdmode ?? null,
          measurement: config.svg.measurement ?? null,
          show_defpoints: config.svg.show_defpoints ?? false,
          proxy_graphic_policy: config.svg.proxy_graphic_policy ?? "SHOW",
          line_policy: config.svg.line_policy ?? "ACCURATE",
          hatch_policy: config.svg.hatch_policy ?? "NORMAL",
          infinite_line_length: config.svg.infinite_line_length ?? 20,
          lineweight_scaling: config.svg.lineweight_scaling ?? 1.0,
          min_lineweight: config.svg.min_lineweight ?? 300,
          min_dash_length: config.svg.min_dash_length ?? 0.1,
          max_flattening_distance: config.svg.max_flattening_distance ?? 0.1,
          circle_approximation_count: config.svg.circle_approximation_count ?? 128,
          hatching_timeout: config.svg.hatching_timeout ?? 30.0,
          min_hatch_line_distance: config.svg.min_hatch_line_distance ?? 1e-4,
          color_policy: config.svg.color_policy ?? "COLOR",
          custom_fg_color: config.svg.custom_fg_color ?? "#00FFF0",
          background_policy: config.svg.background_policy ?? "DEFAULT",
          custom_bg_color: config.svg.custom_bg_color ?? "#fff00f",
          lineweight_policy: config.svg.lineweight_policy ?? "ABSOLUTE",
          text_policy: config.svg.text_policy ?? "FILLING",
          image_policy: config.svg.image_policy ?? "DISPLAY",
          use_drawing_addon: true,  // Signal to the Python renderer to use the Drawing add-on
          _timestamp: timestamp // Add timestamp to prevent caching
        };
        effectiveConfig = svgConfig;
      }
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