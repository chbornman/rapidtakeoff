import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  INITIAL_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_IN_FACTOR,
  ZOOM_OUT_FACTOR,
  SVG_STYLE_CSS,
  SVGRendererConfig,
  DEFAULT_SVG_CONFIG
} from "../renderer_constants";

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

export default function Canvas({ data, onReload, rendererConfig }: CanvasProps) {
  // Only raw SVG markup is supported
  if (!data || typeof data !== "string") {
    return null;
  }
  
  // Merge provided config with defaults
  const config = { ...DEFAULT_SVG_CONFIG, ...rendererConfig };
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
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
      // Get SVG dimensions
      const viewBox = svgEl.getAttribute("viewBox");
      if (viewBox) {
        const [, , svgWidth, svgHeight] = viewBox.split(" ").map(Number);
        
        // Get container dimensions
        const container = containerRef.current;
        if (!container) return;
        const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
        
        // Calculate appropriate zoom level to fit
        const widthRatio = containerWidth / svgWidth;
        const heightRatio = containerHeight / svgHeight;
        const fitZoom = Math.min(widthRatio, heightRatio) * 0.9; // 90% to add some margin
        
        // Set appropriate zoom and center the content
        setZoom(fitZoom);
        setOffset({
          x: (containerWidth - svgWidth * fitZoom) / 2,
          y: (containerHeight - svgHeight * fitZoom) / 2
        });
      }
    } catch (e) {
      console.error("Error auto-fitting content:", e);
    }
  }, []);

  // Ensure SVG scales to container and apply styling
  useEffect(() => {
    const svgEl = svgWrapperRef.current?.querySelector("svg");
    if (svgEl) {
      // fit SVG to container and override stroke styles for thinner non-scaling lines
      svgEl.setAttribute("width", "100%");
      svgEl.setAttribute("height", "100%");
      svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
      
      // Only add our style if there's no vector-effect style already
      if (!svgEl.querySelector("style")) {
        // prepend style block to apply customized SVG styles (e.g., stroke width)
        const styleTag = document.createElementNS("http://www.w3.org/2000/svg", "style");
        styleTag.textContent = SVG_STYLE_CSS;
        svgEl.prepend(styleTag);
      }
      
      // Ensure all paths have vector-effect attribute
      if (config.vector_effect) {
        const elements = svgEl.querySelectorAll("path, line, polyline, circle, ellipse, rect, polygon");
        elements.forEach(el => {
          el.setAttribute("vector-effect", "non-scaling-stroke");
          // Use the configured line width from config
          el.setAttribute("stroke-width", String(config.line_width));
        });
      }
      
      // Auto-fit content on first load
      autoFitContent();
    }
  }, [data, config.vector_effect, autoFitContent]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR;
    const newZoom = Math.min(Math.max(zoom * factor, MIN_ZOOM), MAX_ZOOM);
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
        backgroundColor: config.bg_color || "white"
      }}
    >
      {/* Zoom and pan controls */}
      <div className="absolute top-2 left-2 z-10 flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(z * ZOOM_IN_FACTOR, MAX_ZOOM));
          }}
          className="p-1 bg-white bg-opacity-75 rounded hover:bg-gray-200"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(z * ZOOM_OUT_FACTOR, MIN_ZOOM));
          }}
          className="p-1 bg-white bg-opacity-75 rounded hover:bg-gray-200"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom(INITIAL_ZOOM);
            setOffset({ x: 0, y: 0 });
          }}
          className="p-1 bg-white bg-opacity-75 rounded hover:bg-gray-200"
          title="Reset View"
        >
          &#8635;
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            autoFitContent();
          }}
          className="p-1 bg-white bg-opacity-75 rounded hover:bg-gray-200 ml-2"
          title="Fit to View"
        >
          <span style={{ fontSize: '14px' }}>&#x1F50D;</span>
        </button>
      </div>
      <div
        ref={svgWrapperRef}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: "100%",
          height: "100%",
          backgroundColor: config.bg_color || "transparent"
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
