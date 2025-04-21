import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DXFData, Entity, LayerVisibility, SelectedFeature } from './types';
import OriginAxes from './entities/OriginAxes';
import DxfEntity from './entities/DxfEntity';

interface CanvasProps {
  dxfData: DXFData | null;
  layerVisibility: LayerVisibility;
  componentVisibility: Record<string, Record<string, boolean>>;
  selectedFeature: SelectedFeature | null;
  onFeatureSelect: (feature: SelectedFeature | null) => void;
  rendererConfig?: any;
}

/**
 * Canvas component for rendering DXF files
 * This is the main component for rendering DXF data as SVG
 */
const Canvas: React.FC<CanvasProps> = ({
  dxfData,
  layerVisibility,
  componentVisibility,
  selectedFeature,
  onFeatureSelect,
  rendererConfig = {}
}) => {
  // Canvas state
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Responsive sizing
  const [canvasSize, setCanvasSize] = useState({
    width: 800,
    height: 600
  });
  
  // Viewport state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [boundingBox, setBoundingBox] = useState({ 
    minX: 0, minY: 0, maxX: 0, maxY: 0, 
    width: 0, height: 0, centerX: 0, centerY: 0 
  });

  // Update canvas size when the window resizes
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    // Initialize size
    updateSize();
    
    // Add resize listener
    window.addEventListener('resize', updateSize);
    
    // Check size after a small delay to ensure the container has rendered
    const initialSizeTimer = setTimeout(updateSize, 100);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateSize);
      clearTimeout(initialSizeTimer);
    };
  }, []);

  // Track first load to determine whether we should reset view
  const isFirstLoad = useRef(true);
  const prevDxfPathRef = useRef<string | null>(null);
  
  // Handle file changes - reset first load flag when DXF file path changes
  useEffect(() => {
    if (dxfData) {
      // Check if this is a new file by examining one of the entities for a unique identifier
      // This approach avoids directly comparing entity counts which could be affected by filtering
      const firstEntityHandle = Object.values(dxfData)[0]?.[0]?.handle;
      
      if (firstEntityHandle && firstEntityHandle !== prevDxfPathRef.current) {
        console.log('[CANVAS] New DXF file detected - will reset view on next render');
        isFirstLoad.current = true;
        prevDxfPathRef.current = firstEntityHandle;
      }
    }
  }, [dxfData]);
  
  // Prepare flat list of entities from DXF data with IDs
  const entities = React.useMemo(() => {
    if (!dxfData) return [];
    
    const result: Entity[] = [];
    Object.entries(dxfData).forEach(([layerName, entities]) => {
      // Skip invisible layers
      if (!layerVisibility[layerName]) return;
      
      entities.forEach((entity, index) => {
        const id = entity.handle;
        // Skip invisible components
        if (
          componentVisibility[layerName] && 
          componentVisibility[layerName][id] === false
        ) {
          return;
        }
        
        // Add to visible entities list
        result.push(entity);
      });
    });
    return result;
  }, [dxfData, layerVisibility, componentVisibility]);

  // Calculate bounding box of all entities
  useEffect(() => {
    if (!entities || entities.length === 0) {
      // Set a default bounding box centered on the origin
      setBoundingBox({
        minX: -10, minY: -10, maxX: 10, maxY: 10,
        width: 20, height: 20, centerX: 0, centerY: 0
      });
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Calculate bounds from all entities
    entities.forEach(entity => {
      // Check entity bounds based on type
      if (entity.type === 'LINE') {
        minX = Math.min(minX, entity.start[0], entity.end[0]);
        minY = Math.min(minY, entity.start[1], entity.end[1]);
        maxX = Math.max(maxX, entity.start[0], entity.end[0]);
        maxY = Math.max(maxY, entity.start[1], entity.end[1]);
      } else if (entity.type === 'CIRCLE') {
        minX = Math.min(minX, entity.center[0] - entity.radius);
        minY = Math.min(minY, entity.center[1] - entity.radius);
        maxX = Math.max(maxX, entity.center[0] + entity.radius);
        maxY = Math.max(maxY, entity.center[1] + entity.radius);
      } else if (entity.type === 'ARC') {
        minX = Math.min(minX, entity.center[0] - entity.radius);
        minY = Math.min(minY, entity.center[1] - entity.radius);
        maxX = Math.max(maxX, entity.center[0] + entity.radius);
        maxY = Math.max(maxY, entity.center[1] + entity.radius);
      } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
        entity.points?.forEach(point => {
          minX = Math.min(minX, point[0]);
          minY = Math.min(minY, point[1]);
          maxX = Math.max(maxX, point[0]);
          maxY = Math.max(maxY, point[1]);
        });
      } else if (entity.type === 'ELLIPSE') {
        // Approximate ellipse bounds
        const majorRadius = Math.sqrt(
          entity.major_axis[0] * entity.major_axis[0] + 
          entity.major_axis[1] * entity.major_axis[1]
        );
        const minorRadius = majorRadius * entity.ratio;
        
        minX = Math.min(minX, entity.center[0] - majorRadius);
        minY = Math.min(minY, entity.center[1] - majorRadius);
        maxX = Math.max(maxX, entity.center[0] + majorRadius);
        maxY = Math.max(maxY, entity.center[1] + majorRadius);
      } else if (entity.type === 'TEXT' || entity.type === 'MTEXT') {
        minX = Math.min(minX, entity.insert[0]);
        minY = Math.min(minY, entity.insert[1]);
        maxX = Math.max(maxX, entity.insert[0] + (entity.height || 10) * 5); // Rough estimate for text width
        maxY = Math.max(maxY, entity.insert[1] + (entity.height || 5));
      } else if (entity.type === 'POINT') {
        minX = Math.min(minX, entity.location[0] - 1);
        minY = Math.min(minY, entity.location[1] - 1);
        maxX = Math.max(maxX, entity.location[0] + 1);
        maxY = Math.max(maxY, entity.location[1] + 1);
      } else if (entity.type === 'SPLINE') {
        entity.control_points?.forEach(point => {
          minX = Math.min(minX, point[0]);
          minY = Math.min(minY, point[1]);
          maxX = Math.max(maxX, point[0]);
          maxY = Math.max(maxY, point[1]);
        });
      } else if (entity.type === 'HATCH') {
        // For HATCH, we don't have direct access to the boundaries here
        // We'll use the boundary_paths if available
        if (entity.boundary_paths) {
          entity.boundary_paths.forEach(path => {
            if (path.type === 'polyline' && path.points) {
              path.points.forEach(point => {
                minX = Math.min(minX, point[0]);
                minY = Math.min(minY, point[1]);
                maxX = Math.max(maxX, point[0]);
                maxY = Math.max(maxY, point[1]);
              });
            } else if (path.type === 'edge' && path.edges) {
              path.edges.forEach(edge => {
                if (edge.type === 'line') {
                  minX = Math.min(minX, edge.start[0], edge.end[0]);
                  minY = Math.min(minY, edge.start[1], edge.end[1]);
                  maxX = Math.max(maxX, edge.start[0], edge.end[0]);
                  maxY = Math.max(maxY, edge.start[1], edge.end[1]);
                } else if (edge.type === 'arc') {
                  minX = Math.min(minX, edge.center[0] - edge.radius);
                  minY = Math.min(minY, edge.center[1] - edge.radius);
                  maxX = Math.max(maxX, edge.center[0] + edge.radius);
                  maxY = Math.max(maxY, edge.center[1] + edge.radius);
                }
              });
            }
          });
        }
      }
    });

    // Handle edge case if no valid bounds were found
    if (minX === Infinity) {
      minX = -100;
      minY = -100;
      maxX = 100;
      maxY = 100;
    }

    // Add very generous padding for initial view
    const padding = Math.max((maxX - minX) * 0.5, (maxY - minY) * 0.5, 50);
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    const centerX = minX + boxWidth / 2;
    const centerY = minY + boxHeight / 2;

    setBoundingBox({ 
      minX, minY, maxX, maxY, 
      width: boxWidth, 
      height: boxHeight,
      centerX, 
      centerY 
    });

    // Calculate the scale based on the bounding box dimensions
    const svgAspectRatio = canvasSize.width / canvasSize.height;
    const boxAspectRatio = boxWidth / boxHeight;
    
    let newScale;
    if (boxAspectRatio > svgAspectRatio) {
      // Width is the constraint
      newScale = canvasSize.width / boxWidth * 0.2; // Start very zoomed out (20% of available space)
    } else {
      // Height is the constraint
      newScale = canvasSize.height / boxHeight * 0.2; // Start very zoomed out (20% of available space)
    }
    
    // Apply initial scale factor from renderer config if available
    if (rendererConfig?.initialScaleFactor) {
      newScale *= rendererConfig.initialScaleFactor;
    }
    
    // Only reset view (scale and offset) on first load, not on config changes
    if (isFirstLoad.current) {
      console.log('[CANVAS] First load - resetting view');
      // Always center on origin (0,0) instead of the bounding box center
      setScale(newScale);
      
      // Since we modified the SVG transform to always center (0,0) at the canvas center,
      // we reset the offset to (0,0) when a file is loaded
      // This ensures the DXF origin (0,0) is always centered in the canvas
      setOffset({ 
        x: 0,
        y: 0
      });
      
      // Mark as no longer the first load
      isFirstLoad.current = false;
    } else {
      console.log('[CANVAS] Config change - preserving current view');
      // Keep current scale and offset
    }
  }, [entities, canvasSize.width, canvasSize.height]);

  // Mouse wheel zoom handler
  const handleMouseWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
    // Note: preventDefault is not used as wheel events are passive by default in modern browsers
    // We use touchAction: 'none' style instead to prevent browser handling
    
    // Get mouse position relative to the SVG element
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate zoom direction and amount
    const direction = event.deltaY > 0 ? -1 : 1;
    const zoomFactor = 0.1;
    const factor = direction > 0 ? (1 + zoomFactor) : (1 / (1 + zoomFactor));
    
    // Calculate new scale with limits
    let newScale = scale * factor;
    newScale = Math.max(0.1, Math.min(100, newScale));
    
    // Calculate offset to zoom toward mouse position
    const scaleDelta = newScale / scale;
    
    // Mouse position in SVG coordinates relative to the center of the canvas
    const svgMouseX = mouseX - (canvasSize.width/2 + offset.x);
    const svgMouseY = mouseY - (canvasSize.height/2 + offset.y);
    
    // Calculate new offset
    const newOffset = {
      x: offset.x - svgMouseX * (scaleDelta - 1),
      y: offset.y - svgMouseY * (scaleDelta - 1)
    };
    
    setScale(newScale);
    setOffset(newOffset);
  }, [scale, offset, canvasSize]);

  // Track if we're actually dragging (moved after mousedown) or just clicking
  const [hasMoved, setHasMoved] = useState(false);

  // Mouse drag handlers
  const handleMouseDown = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    // Allow panning with any mouse button
    setIsDragging(true);
    setHasMoved(false); // Reset movement tracking
    setDragStart({ x: event.clientX, y: event.clientY });
    event.preventDefault();
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      // Calculate distance moved
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      
      // Check if we've moved enough to consider it a drag
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        setHasMoved(true);
      }
      
      setOffset({
        x: offset.x + dx,
        y: offset.y + dy
      });
      setDragStart({ x: event.clientX, y: event.clientY });
      event.preventDefault();
    }
  }, [isDragging, offset, dragStart]);

  // Handle both regular and click events
  const handleMouseUp = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    // If we didn't actually drag (just clicked), pass the event through
    if (isDragging && !hasMoved && event.target) {
      // Let entity clicks handle themselves
      // Event bubbling will naturally allow clicks on entities
    }
    
    setIsDragging(false);
  }, [isDragging, hasMoved]);

  // Derive list of visible layers for filtering
  const visibleLayers = React.useMemo(() => {
    return Object.entries(layerVisibility)
      .filter(([_, isVisible]) => isVisible)
      .map(([layerName]) => layerName);
  }, [layerVisibility]);

  // Create empty entities array if no data
  const displayEntities = entities.length > 0 ? entities : [];
  
  // Track mouse position for coordinate display
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, svgX: 0, svgY: 0 });
  
  // Handler to update mouse position
  const handleMouseMoveWithCoords = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    // Original mouse move behavior for dragging
    handleMouseMove(event);
    
    // Get mouse position in client coordinates
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Convert to SVG/drawing coordinates, taking into account the new transform
    // We need to subtract the canvas center position as well as the offset
    // For Y coordinate, we negate the value because we flipped the Y axis in the transform
    const svgX = (mouseX - (canvasSize.width/2 + offset.x)) / scale;
    const svgY = -1 * (mouseY - (canvasSize.height/2 + offset.y)) / scale;
    
    // Update state with both client and SVG coordinates
    setMousePosition({ x: mouseX, y: mouseY, svgX, svgY });
  }, [handleMouseMove, offset, scale, canvasSize]);

  // Render the canvas
  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Coordinate display overlay */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-md font-mono text-sm z-10">
        X: {mousePosition.svgX.toFixed(4)} Y: {mousePosition.svgY.toFixed(4)}
      </div>
      
      <svg
        ref={svgRef}
        width={canvasSize.width}
        height={canvasSize.height}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        style={{ 
          background: rendererConfig.backgroundColor || '#2e2e2e', 
          cursor: isDragging ? 'grabbing' : 'grab', // Use grab cursor to indicate pannable canvas
          touchAction: 'none' // Prevent browser handling of pan/zoom
        }}
        onWheel={handleMouseWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveWithCoords}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setMousePosition({ x: 0, y: 0, svgX: 0, svgY: 0 });
        }}
      >
        {/* Main graphics group with transformation 
             First translate to center of canvas, then apply the offset, then scale
             This ensures (0,0) is at the center of the canvas when offset is (0,0)
             We flip the Y axis (scale(1, -1)) to match standard engineering coordinate system
         */}
        <g transform={`translate(${canvasSize.width/2 + offset.x}, ${canvasSize.height/2 + offset.y}) scale(${scale}, ${-scale})`}>
          {/* Background grid (optional) */}
          {rendererConfig.showGrid !== false && (
            <g className="grid-lines">
              {/* Create grid lines - scaled down by 10x for smaller DXF files */}
              {Array.from({ length: 300 }, (_, i) => i - 150).map(i => (
                <React.Fragment key={`grid-${i}`}>
                  {/* Vertical grid lines (0.1 unit spacing) */}
                  <line
                    x1={i * 0.1}
                    y1={-1000000}
                    x2={i * 0.1}
                    y2={1000000}
                    stroke="#555555"
                    strokeWidth={0.02 / scale}
                    strokeDasharray={`${0.1 / scale},${0.3 / scale}`}
                    opacity={0.3}
                  />
                  {/* Horizontal grid lines (0.1 unit spacing) */}
                  <line
                    x1={-1000000}
                    y1={i * 0.1}
                    x2={1000000}
                    y2={i * 0.1}
                    stroke="#555555"
                    strokeWidth={0.02 / scale}
                    strokeDasharray={`${0.1 / scale},${0.3 / scale}`}
                    opacity={0.3}
                  />
                </React.Fragment>
              ))}
              
              {/* Major grid lines (every 0.5 units) */}
              {Array.from({ length: 60 }, (_, i) => i - 30).map(i => (
                <React.Fragment key={`major-grid-${i}`}>
                  {/* Vertical major grid lines */}
                  <line
                    x1={i * 0.5}
                    y1={-1000000}
                    x2={i * 0.5}
                    y2={1000000}
                    stroke="#666666"
                    strokeWidth={0.05 / scale}
                    strokeDasharray={`${0.2 / scale},${0.2 / scale}`}
                    opacity={0.5}
                  />
                  {/* Horizontal major grid lines */}
                  <line
                    x1={-1000000}
                    y1={i * 0.5}
                    x2={1000000}
                    y2={i * 0.5}
                    stroke="#666666"
                    strokeWidth={0.05 / scale}
                    strokeDasharray={`${0.2 / scale},${0.2 / scale}`}
                    opacity={0.5}
                  />
                </React.Fragment>
              ))}
            </g>
          )}
          
          {/* Origin axes */}
          <OriginAxes 
            halfWidth={Math.max(boundingBox.width / 2, 100)} 
            halfHeight={Math.max(boundingBox.height / 2, 100)} 
            xAxisColor={rendererConfig.xAxisColor || '#ff5555'} 
            yAxisColor={rendererConfig.yAxisColor || '#55ff55'} 
            strokeWidth={1 / scale} // Adjust stroke width based on scale
          />

          {/* Render bounding box for debugging */}
          {rendererConfig.showBoundingBox && (
            <rect
              x={boundingBox.minX}
              y={boundingBox.minY}
              width={boundingBox.width}
              height={boundingBox.height}
              fill="none"
              stroke="#999"
              strokeWidth={1 / scale}
              strokeDasharray={`${5 / scale},${5 / scale}`}
            />
          )}

          {/* Render entities */}
          {displayEntities.map(entity => (
            <DxfEntity
              key={entity.handle}
              entity={entity}
              isSelected={selectedFeature?.entity.handle === entity.handle}
              onClick={() => {
                // Find layer and index information for the selected entity
                let layerName = '';
                let entityIndex = -1;
                
                // Search through the original data to find the layer and index
                Object.entries(dxfData).forEach(([layer, layerEntities]) => {
                  const idx = layerEntities.findIndex(e => e.handle === entity.handle);
                  if (idx !== -1) {
                    layerName = layer;
                    entityIndex = idx;
                  }
                });
                
                if (layerName) {
                  onFeatureSelect({
                    layerName,
                    entityType: entity.type,
                    entityIndex,
                    entity
                  });
                }
              }}
              rendererConfig={{
                ...rendererConfig,
                canvas: {
                  ...rendererConfig.canvas,
                  colors: {
                    ...rendererConfig.canvas?.colors,
                    default: '#ffffff',
                    selection: '#ff9900',
                    hover: '#ffcc00',
                    background: '#2e2e2e'
                  }
                }
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default Canvas;