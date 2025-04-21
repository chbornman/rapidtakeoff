/**
 * SVG Renderer Configuration
 * Provides default settings and configuration options for the DXF to SVG renderer
 */
import { svgRenderer, colors } from './styles/theme';

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
 */
export const SVG_STYLE_CSS = `* { stroke-width: ${svgRenderer.default.lineWidth}px; }`;

/**
 * SVG renderer configuration interface
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
  quality?: 'low' | 'medium' | 'high';
  scale?: number;
}

/**
 * Default configuration for the SVG renderer
 */
export const DEFAULT_SVG_CONFIG: SVGRendererConfig = {
  line_width: svgRenderer.default.lineWidth,
  text_size_factor: 1.0,
  text_color: svgRenderer.default.textColor, 
  bg_color: svgRenderer.default.backgroundColor,
  line_color: svgRenderer.default.lineColor,
  show_paper_border: true,
  vector_effect: false,
  debug_render: svgRenderer.default.debug,
  quality: 'high',
  scale: 1.0
};