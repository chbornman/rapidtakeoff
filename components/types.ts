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
  canvas?: {
    zoom?: {
      initial?: number;
      min?: number;
      max?: number;
      inFactor?: number;
      outFactor?: number;
    };
    colors?: {
      background?: string;
      selection?: string;
      hover?: string;
      default?: string;
      boundingBox?: string;
    };
    rendering?: {
      boundsPadding?: number;
      boundsScalingFactor?: number;
      preserveAspectRatio?: boolean;
      thresholdForExtremeCoordinates?: number;
      minimumEntitySize?: number;
      minTextBoxSize?: number;
      textPadding?: number;
    };
  };
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

/**
 * Layer visibility state
 */
export interface LayerVisibility {
  [layerName: string]: boolean;
}

/**
 * Rendering mode options
 */
export type RenderingMode = 'component' | 'ezdxf';


/**
 * Interface for DXF file data
 */
export interface DXFData {
  [layerName: string]: Entity[];
}

/**
 * Line entity
 */
export interface LineEntity extends Entity {
  type: 'LINE';
  start: number[];
  end: number[];
}

/**
 * Point entity
 */
export interface PointEntity extends Entity {
  type: 'POINT';
  location: number[];
}

/**
 * Circle entity
 */
export interface CircleEntity extends Entity {
  type: 'CIRCLE';
  center: number[];
  radius: number;
}

/**
 * Arc entity
 */
export interface ArcEntity extends Entity {
  type: 'ARC';
  center: number[];
  radius: number;
  start_angle: number;
  end_angle: number;
}

/**
 * Ellipse entity
 */
export interface EllipseEntity extends Entity {
  type: 'ELLIPSE';
  center: number[];
  major_axis: number[];
  ratio: number;
  start_param: number;
  end_param: number;
}

/**
 * Polyline entity
 */
export interface PolylineEntity extends Entity {
  type: 'LWPOLYLINE' | 'POLYLINE';
  points: number[][];
  closed: boolean;
  const_width?: number;
}

/**
 * Spline entity
 */
export interface SplineEntity extends Entity {
  type: 'SPLINE';
  degree: number;
  closed: boolean;
  control_points: number[][];
  knots?: number[];
  weights?: number[];
}

/**
 * Text entity
 */
export interface TextEntity extends Entity {
  type: 'TEXT' | 'MTEXT';
  text: string;
  insert: number[];
  height: number;
  rotation: number;
}

/**
 * Hatch entity
 */
export interface HatchEntity extends Entity {
  type: 'HATCH';
  pattern_name: string;
  solid_fill: boolean;
  pattern_scale: number;
  pattern_angle: number;
  paths: number;
}

/**
 * Mouse wheel handling options
 */
export interface WheelHandlerOptions {
  zoomInFactor: number;
  zoomOutFactor: number;
  minZoom: number;
  maxZoom: number;
  defaultDirection?: 'in' | 'out';
  // Threshold for zoom out detection (higher means harder to trigger)
  zoomOutThreshold?: number;
  // Threshold for zoom in detection (lower means easier to trigger)
  zoomInThreshold?: number;
  // Enable logging for debugging
  debug?: boolean;
}

/**
 * Result from wheel handler
 */
export interface WheelResult {
  zoomChange: number;
  wheelDirection: number; // -1 for in, 1 for out, 0 for no change
  newZoom: number;
}