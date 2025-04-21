import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  colors,
  shadows,
  components as themeComponents,
} from "../styles/theme";

// Define SVGRendererConfig interface for ezdxf
interface SVGRendererConfig {
  lineweight?: number;
  text_size_factor?: number;
  text_color?: string | null;
  bg_color?: string | null;
  stroke_color?: string | null;
  show_paper_border?: boolean;
  use_vector_effect?: boolean;
  debug?: boolean;
  quality?: "low" | "medium" | "high";
  scale?: number;
  // DXF drawing add-on options (ezdxf Configuration)
  pdsize?: number | null;                 // POINT entity size (None = header PDSIZE)
  pdmode?: number | null;                 // POINT mode (None = header PDMODE)
  measurement?: number | null;            // 0=imperial,1=metric (None = header MEASUREMENT)
  show_defpoints?: boolean;               // show POINTs on defpoints layer
  proxy_graphic_policy?: "IGNORE" | "SHOW" | "PREFER";
  line_policy?: "SOLID" | "ACCURATE" | "APPROXIMATE";
  hatch_policy?: "NORMAL" | "IGNORE" | "SHOW_OUTLINE" | "SHOW_SOLID" | "SHOW_APPROXIMATE_PATTERN";
  infinite_line_length?: number;          // length for infinite LINES/XLINEs
  lineweight_scaling?: number;            // multiplier for DXF lineweights
  min_lineweight?: number | null;         // minimum lineweight in 1/300" (None = default)
  min_dash_length?: number;               // minimum dash segment length
  max_flattening_distance?: number;       // curve flattening tol. (drawing units)
  circle_approximation_count?: number;    // segments to approximate full circle
  hatching_timeout?: number;              // seconds before aborting hatch pattern
  min_hatch_line_distance?: number;       // minimum hatch line spacing
  color_policy?: "COLOR" | "COLOR_SWAP_BW" | "COLOR_NEGATIVE" | "MONOCHROME" | "MONOCHROME_DARK_BG" | "MONOCHROME_LIGHT_BG" | "BLACK" | "WHITE" | "CUSTOM";
  custom_fg_color?: string;               // for COLOR_POLICY=CUSTOM
  background_policy?: "DEFAULT" | "WHITE" | "BLACK" | "PAPERSPACE" | "MODELSPACE" | "OFF" | "CUSTOM";
  custom_bg_color?: string;               // for BACKGROUND_POLICY=CUSTOM
  lineweight_policy?: "ABSOLUTE" | "RELATIVE" | "RELATIVE_FIXED";
  text_policy?: "FILLING" | "OUTLINE" | "REPLACE_RECT" | "REPLACE_FILL" | "IGNORE";
  image_policy?: "DISPLAY" | "RECT" | "MISSING" | "PROXY" | "IGNORE";
}

/**
 * SVG Canvas to render ezdxf-generated SVG markup.
 * Props:
 *  - data: raw SVG string
 *  - onReload: optional callback to re-render
 *  - rendererConfig: optional configuration for the SVG renderer
 */
interface CanvasProps {
  data: string;
  onReload?: () => void;
  rendererConfig?: SVGRendererConfig;
}

export default function Canvas({
  data,
  onReload,
  rendererConfig,
}: CanvasProps) {
  // Only raw SVG markup is supported
  if (!data || typeof data !== "string") {
    return null;
  }

  // Canvas zoom/pan configuration values
  const [canvasConfig, setCanvasConfig] = useState({
    INITIAL_ZOOM: 1,
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 10,
    ZOOM_IN_FACTOR: 1.1,
    ZOOM_OUT_FACTOR: 0.9
  });
  
  // Load canvas configuration values from renderer config JSON
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // @ts-ignore - electron is declared in the global scope via preload
        const config = await window.electron.getRendererConfig();
        if (config) {
          // Only update canvas-specific config values
          setCanvasConfig({
            INITIAL_ZOOM: config.INITIAL_ZOOM || 1,
            MIN_ZOOM: config.MIN_ZOOM || 0.1,
            MAX_ZOOM: config.MAX_ZOOM || 10,
            ZOOM_IN_FACTOR: config.ZOOM_IN_FACTOR || 1.1,
            ZOOM_OUT_FACTOR: config.ZOOM_OUT_FACTOR || 0.9
          });
        }
      } catch (error) {
        console.error('Error loading canvas config:', error);
        // We don't need to handle errors here as it's handled in the parent component
      }
    };
    loadConfig();
  }, []);
  
  // Use only provided config without defaults
  const config = rendererConfig || {};
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(canvasConfig.INITIAL_ZOOM);
  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Auto-center and fit the SVG content on first load
  const autoFitContent = useCallback(() => {
    const svgEl = svgWrapperRef.current?.querySelector("svg");
    if (!svgEl) return;

    try {
      // Determine SVG dimensions (use viewBox if available, otherwise bounding box)
      let svgWidth: number, svgHeight: number;
      const viewBoxAttr = svgEl.getAttribute("viewBox");
      if (viewBoxAttr) {
        const [, , wbWidth, wbHeight] = viewBoxAttr.split(" ").map(Number);
        svgWidth = wbWidth;
        svgHeight = wbHeight;
      } else {
        const bbox = svgEl.getBBox();
        svgWidth = bbox.width;
        svgHeight = bbox.height;
      }
      // Get container dimensions
      const container = containerRef.current;
      if (!container || svgWidth === 0 || svgHeight === 0) return;
      const { width: containerWidth, height: containerHeight } =
        container.getBoundingClientRect();

      // Calculate appropriate zoom level to fit
      const widthRatio = containerWidth / svgWidth;
      const heightRatio = containerHeight / svgHeight;
      const fitZoom = Math.min(widthRatio, heightRatio) * 0.9; // 90% to add some margin

      // Set appropriate zoom and center the content
      setZoom(fitZoom);
      setOffset({
        x: (containerWidth - svgWidth * fitZoom) / 2,
        y: (containerHeight - svgHeight * fitZoom) / 2,
      });
    } catch (e) {
      console.error("Error auto-fitting content:", e);
    }
  }, []);

  // Just ensure SVG scales to container
  useEffect(() => {
    const svgEl = svgWrapperRef.current?.querySelector("svg");
    if (svgEl) {
      // Make SVG responsive within container
      svgEl.setAttribute("width", "100%");
      svgEl.setAttribute("height", "100%");
      svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }
  }, [data]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? canvasConfig.ZOOM_IN_FACTOR : canvasConfig.ZOOM_OUT_FACTOR;
    const newZoom = Math.min(Math.max(zoom * factor, canvasConfig.MIN_ZOOM), canvasConfig.MAX_ZOOM);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dx = (mx / zoom) * (newZoom - zoom);
      const dy = (my / zoom) * (newZoom - zoom);
      setOffset({ x: offset.x - dx, y: offset.y - dy });
    }
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = offset;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setOffset({ x: offsetStart.current.x + dx, y: offsetStart.current.y + dy });
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        cursor: isPanning ? "grabbing" : "grab",
        backgroundColor: themeComponents.canvas.backgroundColor,
        boxShadow: themeComponents.canvas.shadow
      }}
    >
      {/* Zoom and pan controls */}
      <div className="absolute top-2 left-2 z-10 flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(z * canvasConfig.ZOOM_IN_FACTOR, canvasConfig.MAX_ZOOM));
          }}
          className="p-1 rounded"
          style={{
            // Use theme button primary styling
            backgroundColor: themeComponents.button.primary.backgroundColor,
            color: themeComponents.button.primary.textColor,
            borderRadius: themeComponents.button.primary.borderRadius,
          }}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(z * canvasConfig.ZOOM_OUT_FACTOR, canvasConfig.MIN_ZOOM));
          }}
          className="p-1 rounded"
          style={{
            // Use theme button primary styling
            backgroundColor: themeComponents.button.primary.backgroundColor,
            color: themeComponents.button.primary.textColor,
            borderRadius: themeComponents.button.primary.borderRadius,
          }}
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom(canvasConfig.INITIAL_ZOOM);
            setOffset({ x: 0, y: 0 });
          }}
          className="p-1 rounded"
          style={{
            // Use theme button primary styling
            backgroundColor: themeComponents.button.primary.backgroundColor,
            color: themeComponents.button.primary.textColor,
            borderRadius: themeComponents.button.primary.borderRadius,
          }}
          title="Reset View"
        >
          &#8635;
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            autoFitContent();
          }}
          className="p-1 rounded ml-2"
          style={{
            // Use theme button secondary styling
            backgroundColor: themeComponents.button.secondary.backgroundColor,
            color: themeComponents.button.secondary.textColor,
            borderRadius: themeComponents.button.secondary.borderRadius,
          }}
          title="Fit to View"
        >
          <span style={{ fontSize: "14px" }}>&#x1F50D;</span>
        </button>
      </div>
      <div
        ref={svgWrapperRef}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: "100%",
          height: "100%",
        }}
        dangerouslySetInnerHTML={{ __html: data }}
      />
      {onReload && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReload();
          }}
          className="absolute top-2 right-2 p-1 bg-white bg-opacity-75 rounded hover:bg-gray-200 z-10"
          title="Reload File"
        >
          ↻
        </button>
      )}
    </div>
  );
}
