// Project-level constants for SVG renderer customization
// Adjust these values to change default zoom, zoom limits, zoom factors, and SVG styling

/**
 * Initial zoom level for the SVG canvas
 */
export const INITIAL_ZOOM = 1;

/**
 * Minimum and maximum zoom levels allowed
 */
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 10;

/**
 * Zoom-in and zoom-out factors applied per step or wheel event
 */
export const ZOOM_IN_FACTOR = 1.1;
export const ZOOM_OUT_FACTOR = 0.9;

/**
 * CSS string prepended to each rendered SVG to control stroke width and other styles
 * You can customize this to adjust line thickness, colors, or add additional SVG rules.
 */
export const SVG_STYLE_CSS = `* { stroke-width: 0.7px; }`;

/**
 * Default SVG rendering configuration options
 * These options are passed to the Python ezdxf renderer
 * 
 * Available options:
 * - line_width: Fixed stroke width for all lines (default: 1)
 * - text_size_factor: Scale factor for text (default: 1.0)
 * - text_color: Text color override (default: null, uses DXF colors)
 * - bg_color: Background color (default: null, transparent)
 * - line_color: Line color override (default: null, uses DXF colors)
 * - show_paper_border: Show/hide paper border (default: false)
 */
export interface SVGRendererConfig {
  line_width?: number;
  text_size_factor?: number;
  text_color?: string | null;
  bg_color?: string | null;
  line_color?: string | null;
  show_paper_border?: boolean;
  vector_effect?: boolean;
  debug_render?: boolean;
}

/**
 * Default configuration for the SVG renderer
 */
export const DEFAULT_SVG_CONFIG: SVGRendererConfig = {
  line_width: 0.7,
  text_size_factor: 1.0,
  text_color: "#000000",  // Black text
  bg_color: "#FFC0CB",    // Pink background
  line_color: "#000000",  // Black lines 
  show_paper_border: true,
  vector_effect: false,
  debug_render: true      // Enable debug rendering
};