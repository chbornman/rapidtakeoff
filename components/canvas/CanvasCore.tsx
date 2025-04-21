import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DXFData, Entity, LayerVisibility, SelectedFeature } from '../types';
import OriginAxes from '../entities/OriginAxes';
import GridLines from './grid/GridLines';
import EntityRenderer from './entities/EntityRenderer';
import CoordinateDisplay from './CoordinateDisplay';
import { handleWheel } from '../utils/wheel-handler';
import { handleDrag } from './utils/canvas-interactions';
import { clientToSvgCoordinates } from '../../utils/dxf/coordinate-utils';
import { calculateBoundingBox } from '../../utils/dxf/bounding-box';

interface CanvasCoreProps {
  dxfData: DXFData | null;
  layerVisibility: LayerVisibility;
  selectedFeature: SelectedFeature | null;
  onFeatureSelect: (feature: SelectedFeature | null) => void;
  rendererConfig?: any;
}

/**
 * Core canvas component for rendering DXF files
 * This is the main component for rendering DXF data as SVG
 */
const CanvasCore: React.FC<CanvasCoreProps> = ({
  dxfData,
  layerVisibility,
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
  
  // Store previous renderer config to detect changes
  const prevRendererConfigRef = useRef<any>(null);
  
  // Handle file changes or rendering mode changes
  useEffect(() => {
    // Detect if this is a new file
    if (dxfData) {
      // Check if this is a new file by examining one of the entities for a unique identifier
      // This approach avoids directly comparing entity counts which could be affected by filtering
      const firstEntityHandle = Object.values(dxfData)[0]?.[0]?.handle;
      
      // Check if we're changing rendering mode
      const prevRenderingMode = prevRendererConfigRef.current?.renderingMode;
      const currentRenderingMode = rendererConfig?.renderingMode;
      const isRenderingModeChanged = prevRenderingMode !== currentRenderingMode && prevRenderingMode !== undefined;
      
      if (firstEntityHandle && firstEntityHandle !== prevDxfPathRef.current) {
        console.log('[CANVAS] New DXF file detected - will reset view on next render');
        isFirstLoad.current = true;
        prevDxfPathRef.current = firstEntityHandle;
      } else if (isRenderingModeChanged) {
        console.log(`[CANVAS] Rendering mode changed from ${prevRenderingMode} to ${currentRenderingMode} - forcing reset`);
        isFirstLoad.current = true;
      }
    }
    
    // Update renderer config reference
    if (rendererConfig && rendererConfig !== prevRendererConfigRef.current) {
      prevRendererConfigRef.current = rendererConfig;
    }
  }, [dxfData, rendererConfig]);
  
  // Debug visibility
  React.useEffect(() => {
    console.log('[CANVAS] Layer visibility:', layerVisibility);
  }, [layerVisibility]);

  // Prepare flat list of entities from DXF data with IDs
  const entities = React.useMemo(() => {
    if (!dxfData) return [];
    
    const result: Entity[] = [];
    Object.entries(dxfData).forEach(([layerName, entities]) => {
      // Skip invisible layers
      if (!layerVisibility[layerName]) return;
      
      // Add all entities from visible layers
      entities.forEach((entity) => {
        result.push(entity);
      });
    });
    return result;
  }, [dxfData, layerVisibility]);

  // Calculate bounding box of all entities
  useEffect(() => {
    // Use the utility to calculate the bounding box
    const box = calculateBoundingBox(entities);
    setBoundingBox(box);

    // Calculate the scale based on the bounding box dimensions
    const svgAspectRatio = canvasSize.width / canvasSize.height;
    const boxAspectRatio = box.width / box.height;
    
    let newScale;
    if (boxAspectRatio > svgAspectRatio) {
      // Width is the constraint
      newScale = canvasSize.width / box.width * 0.8; // Start zoomed in to 80% of available space
    } else {
      // Height is the constraint
      newScale = canvasSize.height / box.height * 0.8; // Start zoomed in to 80% of available space
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
    // Prevent default browser zoom behavior
    event.preventDefault();
    
    // Use the wheel handler utility
    const result = handleWheel({
      event,
      currentScale: scale,
      currentOffset: offset,
      minScale: 0.1,
      maxScale: 100,
      zoomFactor: 0.1
    });
    
    setScale(result.newScale);
    setOffset(result.newOffset);
  }, [scale, offset]);

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
      // Use the drag handler utility
      const result = handleDrag({
        event,
        dragStart,
        currentOffset: offset
      });
      
      setHasMoved(result.hasMoved);
      setOffset(result.newOffset);
      setDragStart(result.newDragStart);
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
    
    // Use the coordinate conversion utility
    const svg = clientToSvgCoordinates(event.clientX, event.clientY, rect, {
      width: canvasSize.width,
      height: canvasSize.height,
      scale: scale,
      offset: offset
    });
    
    // Update state with both client and SVG coordinates
    setMousePosition({ 
      x: event.clientX - rect.left, 
      y: event.clientY - rect.top, 
      svgX: svg.x, 
      svgY: svg.y 
    });
  }, [handleMouseMove, offset, scale, canvasSize]);

  // Render the canvas
  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Coordinate display overlay */}
      <CoordinateDisplay x={mousePosition.svgX} y={mousePosition.svgY} />
      
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
        id="wireframe-canvas" // Add ID to target with CSS if needed
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
          {/* Background grid */}
          <GridLines scale={scale} showGrid={rendererConfig.showGrid !== false} />
          
          {/* Origin axes - only render if Origin & Axes layer is visible */}
          {layerVisibility['Origin & Axes'] && (
            <OriginAxes 
              halfWidth={Math.max(boundingBox.width / 2, 100)} 
              halfHeight={Math.max(boundingBox.height / 2, 100)} 
              xAxisColor={rendererConfig.xAxisColor || '#ff5555'} 
              yAxisColor={rendererConfig.yAxisColor || '#55ff55'} 
              strokeWidth={1 / scale} // Adjust stroke width based on scale
            />
          )}

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
          <EntityRenderer
            entities={displayEntities}
            selectedFeature={selectedFeature}
            onFeatureSelect={onFeatureSelect}
            rendererConfig={rendererConfig}
            dxfData={dxfData}
          />
        </g>
      </svg>
    </div>
  );
};

export default CanvasCore;