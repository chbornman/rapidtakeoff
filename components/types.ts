/**
 * Shared types for SVG rendering configuration.
 */
export interface SVGRendererConfig {
  pdsize?: number | null;
  /** Enable debug mode for rendering */
  debug?: boolean;
  pdmode?: number | null;
  measurement?: number | null;
  show_defpoints?: boolean;
  proxy_graphic_policy?: "IGNORE" | "SHOW" | "PREFER";
  line_policy?: "SOLID" | "ACCURATE" | "APPROXIMATE";
  hatch_policy?: "NORMAL" | "IGNORE" | "SHOW_OUTLINE" | "SHOW_SOLID" | "SHOW_APPROXIMATE_PATTERN";
  infinite_line_length?: number;
  lineweight_scaling?: number;
  min_lineweight?: number | null;
  min_dash_length?: number;
  max_flattening_distance?: number;
  circle_approximation_count?: number;
  hatching_timeout?: number;
  min_hatch_line_distance?: number;
  color_policy?: "COLOR" | "COLOR_SWAP_BW" | "COLOR_NEGATIVE" | "MONOCHROME" | "MONOCHROME_DARK_BG" | "MONOCHROME_LIGHT_BG" | "BLACK" | "WHITE" | "CUSTOM";
  custom_fg_color?: string;
  background_policy?: "DEFAULT" | "WHITE" | "BLACK" | "PAPERSPACE" | "MODELSPACE" | "OFF" | "CUSTOM";
  custom_bg_color?: string;
  lineweight_policy?: "ABSOLUTE" | "RELATIVE" | "RELATIVE_FIXED";
  text_policy?: "FILLING" | "OUTLINE" | "REPLACE_RECT" | "REPLACE_FILL" | "IGNORE";
  image_policy?: "DISPLAY" | "RECT" | "MISSING" | "PROXY" | "IGNORE";
}

/**
 * Interface for DXF entity data
 */
export interface Entity {
  type: string;
  handle?: string;
  layer?: string;
  id?: string;
  [key: string]: any;
}

/**
 * Interface for selected entity data
 */
export interface SelectedFeature {
  layerName: string;
  entityType: string;
  entityIndex: number;
  entity: Entity;
}