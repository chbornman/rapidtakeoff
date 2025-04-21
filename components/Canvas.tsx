import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  colors,
  shadows,
  components as themeComponents,
} from "../styles/theme";
import type { SVGRendererConfig, SelectedFeature } from "./types";

/**
 * SVG Canvas to render ezdxf-generated SVG markup.
 * Props:
 *  - data: raw SVG string
 *  - rendererConfig: optional configuration for the SVG renderer
 *  - selectedFeature: currently selected feature to highlight
 *  - onFeatureSelect: callback when user selects a feature by clicking on the canvas
 */
interface CanvasProps {
  data: string;
  rendererConfig?: SVGRendererConfig;
  selectedFeature?: SelectedFeature | null;
  onFeatureSelect?: (feature: SelectedFeature | null) => void;
}

export default function Canvas({
  data,
  rendererConfig,
  selectedFeature,
  onFeatureSelect,
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
    ZOOM_OUT_FACTOR: 0.9,
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
            ZOOM_OUT_FACTOR: config.ZOOM_OUT_FACTOR || 0.9,
          });
        }
      } catch (error) {
        console.error("Error loading canvas config:", error);
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
  // Track pointer position (SVG coords) and container size for overlay display
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Update container size on mount and window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Add styles for hover effects and highlighting selected features
  useEffect(() => {
    // Create a style element for our hover effects if it doesn't exist
    if (!document.getElementById("svg-hover-styles")) {
      const styleEl = document.createElement("style");
      styleEl.id = "svg-hover-styles";
      styleEl.textContent = `
        svg path:hover, svg line:hover, svg circle:hover, 
        svg rect:hover, svg polyline:hover, svg ellipse:hover,
        svg polyline:hover, svg polygon:hover {
          stroke-width: 2px !important;
          cursor: pointer !important;
          stroke-opacity: 0.8 !important;
        }
        
        .highlighted-feature {
          stroke: #FF0000 !important;
          stroke-width: 2px !important;
          fill-opacity: 0.7 !important;
        }
        
        /* Force stroke color for selected elements */
        svg .highlighted-feature {
          stroke: #FF0000 !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  // Auto-center and fit the SVG content on first load
  const autoFitContent = useCallback(() => {
    const svgEl = svgWrapperRef.current?.querySelector("svg");
    if (!svgEl) return;

    try {
      // Determine SVG dimensions (use viewBox if available, otherwise bounding box)
      let svgWidth: number, svgHeight: number;
      let minX: number = 0,
        minY: number = 0;
      const viewBoxAttr = svgEl.getAttribute("viewBox");
      if (viewBoxAttr) {
        const [vbX, vbY, vbWidth, vbHeight] = viewBoxAttr
          .split(" ")
          .map(Number);
        minX = vbX;
        minY = vbY;
        svgWidth = vbWidth;
        svgHeight = vbHeight;
      } else {
        const bbox = svgEl.getBBox();
        minX = bbox.x;
        minY = bbox.y;
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

      // Calculate the center of the viewBox in SVG coordinate space
      const boxCenterX = minX + svgWidth / 2;
      const boxCenterY = minY + svgHeight / 2;

      // Set appropriate zoom
      setZoom(fitZoom);

      // Calculate offset to center the viewBox center in the container
      setOffset({
        x: containerWidth / 2 - boxCenterX * fitZoom,
        y: containerHeight / 2 - boxCenterY * fitZoom,
      });

      console.log("Auto fit content:", {
        viewBox: { minX, minY, width: svgWidth, height: svgHeight },
        center: { x: boxCenterX, y: boxCenterY },
        containerSize: { width: containerWidth, height: containerHeight },
        zoom: fitZoom,
      });
    } catch (e) {
      console.error("Error auto-fitting content:", e);
    }
  }, []);

  // Ensure SVG scales to container
  useEffect(() => {
    const svgEl = svgWrapperRef.current?.querySelector("svg");
    if (svgEl) {
      // Make SVG responsive within container
      svgEl.setAttribute("width", "100%");
      svgEl.setAttribute("height", "100%");
      svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }
  }, [data]);

  // Handle feature selection highlighting - simplified approach
  useEffect(() => {
    const svgEl = svgWrapperRef.current?.querySelector("svg");
    if (!svgEl) return;

    // Reset previous selections first
    const previousSelectedElements = svgEl.querySelectorAll(
      ".highlighted-feature",
    );
    previousSelectedElements.forEach((el) => {
      el.classList.remove("highlighted-feature");
      if (el instanceof SVGElement) {
        // Restore original stroke color and other properties
        el.style.stroke = "";
        el.style.strokeWidth = "";
      }
    });

    // If no feature is selected, just cleanup and return
    if (!selectedFeature) return;

    try {
      // Get the entity type and index from the selected feature
      const entityType = selectedFeature.entityType.toLowerCase();
      const entityIndex = selectedFeature.entityIndex;

      // First approach: Try to select element directly by its index across all SVG shapes
      // We'll look for specific tag types based on the entity type
      let targetTags: string[] = [];

      // Map DXF entity types to SVG tag names
      switch (entityType) {
        // Basic Geometric Entities
        case "line":
          targetTags = ["line"];
          break;
        case "point":
          targetTags = ["circle", "path"]; // Points are often rendered as tiny circles
          break;
        case "circle":
          targetTags = ["circle"];
          break;
        case "arc":
          targetTags = ["path"];
          break;
        case "ellipse":
          targetTags = ["ellipse", "path"]; // Some renderers use paths for ellipses
          break;

        // Curve Entities
        case "spline":
          targetTags = ["path"];
          break;
        case "polyline":
        case "lwpolyline":
          targetTags = ["polyline", "path", "polygon"];
          break;
        case "helix":
          targetTags = ["path"];
          break;
        case "leader":
          targetTags = ["path", "polyline"];
          break;

        // Complex Entities
        case "hatch":
          targetTags = ["path", "g"];
          break;
        case "solid":
        case "3dface":
          targetTags = ["polygon", "path"];
          break;
        case "mesh":
          targetTags = ["path", "g"];
          break;
        case "3dsolid":
        case "body":
          targetTags = ["path", "g"];
          break;

        // Dimension Entities
        case "dimension":
          targetTags = ["g", "path", "text"];
          break;
        case "mtext":
        case "text":
          targetTags = ["text", "tspan"];
          break;

        // Organizational Entities
        case "insert":
          targetTags = ["g", "use"];
          break;

        // Advanced Entities
        case "image":
          targetTags = ["image"];
          break;
        case "wipeout":
          targetTags = ["path", "rect"];
          break;
        case "acad_table":
          targetTags = ["g", "text", "rect", "line"];
          break;
        case "mline":
          targetTags = ["g", "path", "polyline"];
          break;
        case "attdef":
        case "attrib":
          targetTags = ["text"];
          break;

        default:
          // If we don't know the specific mapping, try all shape elements
          targetTags = [
            "path",
            "line",
            "circle",
            "rect",
            "ellipse",
            "polyline",
            "polygon",
            "g",
            "text",
            "image",
            "use",
          ];
      }

      // Find elements based on target tags and try to match by index
      let foundMatch = false;

      // First try: Find elements of the matching type and select by index
      for (const tag of targetTags) {
        const elements = svgEl.querySelectorAll(tag);

        // If we have enough elements of this type, select the one at our index
        if (elements.length > entityIndex) {
          const el = elements[entityIndex];
          if (el instanceof SVGElement) {
            el.classList.add("highlighted-feature");
            foundMatch = true;
            break;
          }
        }
      }

      // Second try: Select the Nth element of any type if first approach failed
      if (!foundMatch) {
        // First, prepare a flat array of all shapes in document order
        const allShapes = svgEl.querySelectorAll(
          "path, line, circle, rect, ellipse, polyline, polygon",
        );

        // If we have enough elements, select the one at our index
        if (allShapes.length > entityIndex) {
          const el = allShapes[entityIndex];
          if (el instanceof SVGElement) {
            el.classList.add("highlighted-feature");
            foundMatch = true;
          }
        }
      }

      // Third try: Select any elements with matching layer if available
      if (!foundMatch && selectedFeature.layerName) {
        const layerGroup = svgEl.querySelector(
          `g[data-layer="${selectedFeature.layerName}"]`,
        );
        if (layerGroup) {
          const shapes = layerGroup.querySelectorAll(
            "path, line, circle, rect, ellipse, polyline, polygon",
          );
          if (shapes.length > 0) {
            // Either select the specific one at index or highlight all in layer
            if (shapes.length > entityIndex) {
              const el = shapes[entityIndex];
              if (el instanceof SVGElement) {
                el.classList.add("highlighted-feature");
                foundMatch = true;
              }
            } else {
              // Highlight all shapes in the layer if we can't find a specific match
              shapes.forEach((shape) => {
                if (shape instanceof SVGElement) {
                  shape.classList.add("highlighted-feature");
                }
              });
              foundMatch = true;
            }
          }
        }
      }

      // Last resort: Highlight everything in the SVG if all else fails
      if (!foundMatch) {
        const allElements = svgEl.querySelectorAll(
          "path, line, circle, rect, ellipse, polyline, polygon",
        );
        if (allElements.length > 0) {
          // If we have many elements, try to limit to just a few around our index
          if (allElements.length > 20) {
            // Try to highlight a few elements around the target index
            const startIdx = Math.max(0, entityIndex - 2);
            const endIdx = Math.min(allElements.length - 1, entityIndex + 2);

            for (let i = startIdx; i <= endIdx; i++) {
              const el = allElements[i];
              if (el instanceof SVGElement) {
                el.classList.add("highlighted-feature");
              }
            }
          } else {
            // If not too many elements, highlight them all
            allElements.forEach((el) => {
              if (el instanceof SVGElement) {
                el.classList.add("highlighted-feature");
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("Error highlighting selected feature:", error);
    }
  }, [selectedFeature, data]);

  // Removed handleWheel as we're now using the addEventListener approach

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = offset;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    // Update pointer position in SVG coordinates
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const svgX = (relX - offset.x) / zoom;
      const svgY = (relY - offset.y) / zoom;
      setPointerPos({ x: +svgX.toFixed(2), y: +svgY.toFixed(2) });
    }
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

  // Handle element click to select a feature
  const handleElementClick = (e: React.MouseEvent) => {
    // Don't process clicks if we're panning
    if (isPanning) return;

    // Find the clicked SVG element
    let target = e.target as Element;

    // Skip if we clicked the background or SVG container
    if (
      !(target instanceof SVGElement) ||
      target.tagName.toLowerCase() === "svg" ||
      target === svgWrapperRef.current
    ) {
      return;
    }

    // If we clicked a generic group, try to find a better target
    if (target.tagName.toLowerCase() === "g") {
      // Try to find first child element that's an actual shape
      const firstShape = target.querySelector(
        "path, line, circle, rect, ellipse, polyline, polygon",
      );
      if (firstShape) {
        target = firstShape;
      }
    }

    // Get layer information
    const layerGroup = target.closest("[data-layer]");
    const layerName = layerGroup?.getAttribute("data-layer") || "DEFAULT";

    // Get entity type - prefer data attribute, fall back to tag name
    const entityType =
      target.getAttribute("data-entity-type") || target.tagName.toUpperCase();

    // Find entity index within its type and layer
    let entityIndex = 0;
    let sameTypeElements: NodeListOf<Element>;

    if (layerGroup) {
      // Find all elements of same type in this layer
      sameTypeElements = layerGroup.querySelectorAll(
        `[data-entity-type="${entityType}"], ${entityType.toLowerCase()}`,
      );
    } else {
      // Fallback: find all elements of same type in whole SVG
      sameTypeElements =
        svgWrapperRef.current?.querySelectorAll(
          `[data-entity-type="${entityType}"], ${entityType.toLowerCase()}`,
        ) || document.createDocumentFragment().querySelectorAll("*");
    }

    entityIndex = Array.from(sameTypeElements).indexOf(target);

    // Skip if we couldn't determine the index
    if (entityIndex === -1) return;

    // Create entity object with properties from SVG attributes
    const entity: any = {
      type: entityType,
      handle: target.getAttribute("data-handle") || undefined,
      layer: layerName,
    };

    // Add geometry properties based on element type
    const tagName = target.tagName.toLowerCase();

    switch (tagName) {
      case "circle":
        entity.center = [
          parseFloat(target.getAttribute("cx") || "0"),
          parseFloat(target.getAttribute("cy") || "0"),
        ];
        entity.radius = parseFloat(target.getAttribute("r") || "0");
        break;

      case "line":
        entity.start = [
          parseFloat(target.getAttribute("x1") || "0"),
          parseFloat(target.getAttribute("y1") || "0"),
        ];
        entity.end = [
          parseFloat(target.getAttribute("x2") || "0"),
          parseFloat(target.getAttribute("y2") || "0"),
        ];
        break;

      case "rect":
        entity.x = parseFloat(target.getAttribute("x") || "0");
        entity.y = parseFloat(target.getAttribute("y") || "0");
        entity.width = parseFloat(target.getAttribute("width") || "0");
        entity.height = parseFloat(target.getAttribute("height") || "0");
        break;

      case "path":
        entity.d = target.getAttribute("d") || "";
        break;

      case "polyline":
      case "polygon":
        entity.points = target.getAttribute("points") || "";
        break;
    }

    // Notify about the selection
    if (onFeatureSelect) {
      // Create the selection object
      const feature: SelectedFeature = {
        layerName,
        entityType,
        entityIndex,
        entity,
      };

      // If clicking the same element that's already selected, deselect it
      if (
        selectedFeature &&
        selectedFeature.layerName === layerName &&
        selectedFeature.entityType === entityType &&
        selectedFeature.entityIndex === entityIndex
      ) {
        onFeatureSelect(null);
      } else {
        onFeatureSelect(feature);
      }
    }
  };

  // Use useEffect to add wheel event listener with { passive: false } option
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Import wheel handling from utils
    import("./utils/wheel-handler")
      .then(({ handleMouseWheel, calculateZoomOffset }) => {
        const wheelHandler = (e: WheelEvent) => {
          e.preventDefault();

          // Use the extracted wheel handler with our config
          const result = handleMouseWheel(e, zoom, {
            zoomInFactor: canvasConfig.ZOOM_IN_FACTOR,
            zoomOutFactor: canvasConfig.ZOOM_OUT_FACTOR,
            minZoom: canvasConfig.MIN_ZOOM,
            maxZoom: canvasConfig.MAX_ZOOM,
            defaultDirection: "in", // Default to zoom in for small movements
            zoomOutThreshold: 25, // Higher threshold for zoom out
            zoomInThreshold: 5, // Lower threshold for zoom in
            debug: true, // Enable debug logging
          });

          // If no significant change, exit early
          if (!result) return;

          const rect = container.getBoundingClientRect();
          if (rect) {
            // Calculate cursor position relative to the container
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            // Calculate new offset to keep cursor position stable
            const newOffset = calculateZoomOffset(
              mx,
              my,
              offset,
              zoom,
              result.newZoom,
            );

            // Update offset for position after zoom
            setOffset(newOffset);
          }

          // Update zoom level
          setZoom(result.newZoom);
        };

        container.addEventListener("wheel", wheelHandler, { passive: false });

        // Store the cleanup function
        return () => {
          container.removeEventListener("wheel", wheelHandler);
        };
      })
      .catch((err) => {
        console.error("Failed to load wheel handler:", err);

        // Fallback to basic wheel handling if module fails to load
        const basicWheelHandler = (e: WheelEvent) => {
          e.preventDefault();
          const delta = -e.deltaY;
          const factor =
            delta > 0
              ? canvasConfig.ZOOM_IN_FACTOR
              : canvasConfig.ZOOM_OUT_FACTOR;
          setZoom(
            Math.min(
              Math.max(zoom * factor, canvasConfig.MIN_ZOOM),
              canvasConfig.MAX_ZOOM,
            ),
          );
        };

        container.addEventListener("wheel", basicWheelHandler, {
          passive: false,
        });

        return () => {
          container.removeEventListener("wheel", basicWheelHandler);
        };
      });

    // Simple cleanup function for when component unmounts before module loads
    return () => {
      // This will be overridden if the module loads successfully
    };
  }, [zoom, offset, canvasConfig]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleElementClick}
      style={{
        cursor: isPanning ? "grabbing" : "pointer",
        backgroundColor: themeComponents.canvas.backgroundColor,
        boxShadow: themeComponents.canvas.shadow,
      }}
    >
      {/* Overlay: canvas size and pointer position */}
      <div className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white text-xs p-1 rounded">
        <div>Canvas: {containerSize.width}px × {containerSize.height}px</div>
        <div>Pointer: {pointerPos.x}, {pointerPos.y}</div>
      </div>
      {/* Zoom and pan controls */}
      <div className="absolute top-2 left-2 z-10 flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) =>
              Math.min(z * canvasConfig.ZOOM_IN_FACTOR, canvasConfig.MAX_ZOOM),
            );
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
            setZoom((z) =>
              Math.max(z * canvasConfig.ZOOM_OUT_FACTOR, canvasConfig.MIN_ZOOM),
            );
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

            // Instead of resetting to origin, center the SVG in the container
            const svgEl = svgWrapperRef.current?.querySelector("svg");
            const container = containerRef.current;

            if (svgEl && container) {
              // Get container dimensions
              const { width: containerWidth, height: containerHeight } =
                container.getBoundingClientRect();

              // Determine SVG dimensions
              let svgWidth: number, svgHeight: number;
              let minX: number = 0,
                minY: number = 0;
              const viewBoxAttr = svgEl.getAttribute("viewBox");
              if (viewBoxAttr) {
                const [vbX, vbY, vbWidth, vbHeight] = viewBoxAttr
                  .split(" ")
                  .map(Number);
                minX = vbX;
                minY = vbY;
                svgWidth = vbWidth;
                svgHeight = vbHeight;
              } else {
                const bbox = svgEl.getBBox();
                minX = bbox.x;
                minY = bbox.y;
                svgWidth = bbox.width;
                svgHeight = bbox.height;
              }

              // Calculate the center of the viewBox in SVG coordinate space
              const boxCenterX = minX + svgWidth / 2;
              const boxCenterY = minY + svgHeight / 2;

              // Set initial zoom
              setZoom(canvasConfig.INITIAL_ZOOM);

              // Calculate offset to center the viewBox center in the container
              setOffset({
                x: containerWidth / 2 - boxCenterX * canvasConfig.INITIAL_ZOOM,
                y: containerHeight / 2 - boxCenterY * canvasConfig.INITIAL_ZOOM,
              });

              console.log("Reset view:", {
                viewBox: { minX, minY, svgWidth, svgHeight },
                center: { x: boxCenterX, y: boxCenterY },
                zoom: canvasConfig.INITIAL_ZOOM,
              });
            } else {
              // Fallback to original behavior if we can't get dimensions
              setZoom(canvasConfig.INITIAL_ZOOM);
              setOffset({ x: 0, y: 0 });
            }
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
    </div>
  );
}
