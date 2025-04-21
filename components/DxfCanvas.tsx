import React, { useState, useRef, useEffect, useCallback } from "react";
import { colors, shadows, components as themeComponents } from "../styles/theme";
import { SelectedFeature, DXFData, LayerVisibility } from "./types";
import DxfEntity from "./entities/DxfEntity";

interface DxfCanvasProps {
  dxfData: DXFData | null;
  layerVisibility: LayerVisibility;
  selectedFeature: SelectedFeature | null;
  onFeatureSelect?: (feature: SelectedFeature | null) => void;
  rendererConfig?: any;
}

/**
 * Component-based DXF Canvas that renders each entity as a React component
 */
const DxfCanvas: React.FC<DxfCanvasProps> = ({
  dxfData,
  layerVisibility,
  selectedFeature,
  onFeatureSelect,
  rendererConfig = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Canvas configuration from props or default values
  const canvasConfig = {
    INITIAL_ZOOM: rendererConfig.canvas?.zoom?.initial || 1,
    MIN_ZOOM: rendererConfig.canvas?.zoom?.min || 0.1,
    MAX_ZOOM: rendererConfig.canvas?.zoom?.max || 10,
    ZOOM_IN_FACTOR: rendererConfig.canvas?.zoom?.inFactor || 1.1,
    ZOOM_OUT_FACTOR: rendererConfig.canvas?.zoom?.outFactor || 0.9,
    BACKGROUND_COLOR: rendererConfig.canvas?.colors?.background || themeComponents.canvas.backgroundColor,
    SELECTION_COLOR: rendererConfig.canvas?.colors?.selection || '#ff0000',
    HOVER_COLOR: rendererConfig.canvas?.colors?.hover || '#4488ff',
    DEFAULT_COLOR: rendererConfig.canvas?.colors?.default || '#ffffff'
  };
  
  // Canvas view state
  const [zoom, setZoom] = useState(canvasConfig.INITIAL_ZOOM);
  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  // State to track if the canvas has been initially fitted
  const [initialFitDone, setInitialFitDone] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // State to store the entity bounding box
  const [boundingBox, setBoundingBox] = useState({
    minX: -50,
    minY: -50,
    width: 100,
    height: 100
  });
  
  // Reference to store the original bounds regardless of aspect ratio or rendering
  const originalBoundsRef = useRef({
    minX: -50,
    minY: -50,
    width: 100,
    height: 100
  });
  
  // Reference to keep track of container dimensions for aspect ratio preservation
  const containerDimensionsRef = useRef({
    width: 0,
    height: 0
  });

  // Explicit function to center content
  const centerContent = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !originalBoundsRef.current) return;
    
    try {
      const svg = svgRef.current;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const bounds = originalBoundsRef.current;
      
      // Calculate the center of the bounding box
      const boxCenterX = bounds.minX + bounds.width / 2;
      const boxCenterY = bounds.minY + bounds.height / 2;
      
      // Calculate zoom level to fit entire bounding box with margin
      const margin = 0.8; // Show bounding box at 80% of container size (20% margin)
      const widthRatio = (containerRect.width * margin) / bounds.width;
      const heightRatio = (containerRect.height * margin) / bounds.height;
      const fitZoom = Math.min(widthRatio, heightRatio);
      
      // Apply scaling factor but don't make it too large
      const scalingFactor = rendererConfig.canvas?.rendering?.boundsScalingFactor || 1.0;
      // Cap the scaling factor at 1.5 for the initial centering to avoid excessive zoom
      const cappedScalingFactor = Math.min(scalingFactor, 1.5);
      
      // Ensure zoom isn't too small or too large
      const newZoom = Math.min(
        Math.max(fitZoom * cappedScalingFactor, canvasConfig.MIN_ZOOM), 
        canvasConfig.MAX_ZOOM
      );
      
      // Calculate offset to center the bounding box
      const offsetX = containerRect.width / 2 - boxCenterX * newZoom;
      const offsetY = containerRect.height / 2 - boxCenterY * newZoom;
      
      // Apply zoom and centering
      setZoom(newZoom);
      setOffset({ x: offsetX, y: offsetY });
      
      // Make sure the SVG viewBox is still set correctly
      const viewBoxString = `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`;
      svg.setAttribute('viewBox', viewBoxString);
      
      console.log("Content centered with:", { 
        zoom: newZoom, 
        offset: { x: offsetX, y: offsetY }, 
        viewBox: viewBoxString,
        boxCenter: { x: boxCenterX, y: boxCenterY }
      });
    } catch (e) {
      console.error("Error centering content:", e);
    }
  }, [rendererConfig.canvas?.rendering?.boundsScalingFactor, canvasConfig]);
  
  // Auto-center and fit the SVG content
  const autoFitContent = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !dxfData) return;
    
    try {
      // Get content boundaries by examining all entities
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let hasValidEntities = false;
      
      // Utility to update bounds from any coordinates array
      const updateBoundsFromCoords = (coords, entityInfo = null) => {
        if (Array.isArray(coords) && coords.length >= 2) {
          // Track each coordinate contribution to the bounding box
          const oldMinX = minX;
          const oldMinY = minY;
          const oldMaxX = maxX;
          const oldMaxY = maxY;
          
          // Check for extreme coordinates (very far from origin)
          const THRESHOLD = rendererConfig.canvas?.rendering?.thresholdForExtremeCoordinates || 5000;
          if (Math.abs(coords[0]) > THRESHOLD || Math.abs(coords[1]) > THRESHOLD) {
            extremeCoordinates.push({
              coords,
              entityInfo
            });
            
            // Log the extreme coordinate for debugging
            console.warn(`Found extreme coordinate: [${coords[0]}, ${coords[1]}] in entity:`, entityInfo);
            
            // Skip extremely large coordinates to avoid massive bounding boxes
            // This is safe because most CAD drawings have reasonable coordinate ranges
            return;
          }
          
          // Detailed coordinate logging for debugging
          if (entityInfo) {
            console.log(`Entity coordinate: [${coords[0].toFixed(2)}, ${coords[1].toFixed(2)}] in ${entityInfo.type} (${entityInfo.layer || 'no-layer'}) ${entityInfo.handle || ''}`);
          }
          
          // Update bounds
          minX = Math.min(minX, coords[0]);
          minY = Math.min(minY, coords[1]);
          maxX = Math.max(maxX, coords[0]);
          maxY = Math.max(maxY, coords[1]);
          hasValidEntities = true;
          
          // Log any changes to the bounding box
          if (minX !== oldMinX || minY !== oldMinY || maxX !== oldMaxX || maxY !== oldMaxY) {
            const logMessage = `Bounding box updated to: [${minX.toFixed(2)}, ${minY.toFixed(2)}] to [${maxX.toFixed(2)}, ${maxY.toFixed(2)}] by ${entityInfo ? entityInfo.type : 'unknown'}`;
            console.log(logMessage);
            
            // Add to window debug logs if available
            if (typeof window !== 'undefined' && window._debugLogs) {
              window._debugLogs.push({
                type: 'bounds-update',
                message: logMessage,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      };
      
      // Utility to update bounds from any point
      const updateBoundsFromPoint = (point, entityInfo) => {
        if (Array.isArray(point) && point.length >= 2) {
          updateBoundsFromCoords(point, entityInfo);
        }
      };
      
      // Detailed debugging log for entity count
      console.log("Calculating bounds for DXF data with layers:", Object.keys(dxfData));
      const totalEntityCount = Object.values(dxfData).reduce((sum, entities) => sum + entities.length, 0);
      
      // Count different entity types to understand the nature of the file
      const entityTypeCount = {};
      Object.values(dxfData).forEach(entities => {
        entities.forEach(entity => {
          entityTypeCount[entity.type] = (entityTypeCount[entity.type] || 0) + 1;
        });
      });
      
      console.log(`Total entities: ${totalEntityCount}, by type:`, entityTypeCount);
      
      // Check if this is a text-heavy file (more than 50% text entities)
      const textEntityCount = (entityTypeCount['TEXT'] || 0) + (entityTypeCount['MTEXT'] || 0);
      const isTextHeavyFile = textEntityCount > 0 && textEntityCount / totalEntityCount > 0.5;
      
      if (isTextHeavyFile) {
        console.log("This appears to be a text-heavy file, will apply special text-specific bounds handling");
      }
      
      // Entities with extreme coordinates for debugging
      const extremeCoordinates = [];
      
      // Add debugging for entity types
      const entityTypeSizes = {};
      
      // Function to track entity bounds for debugging
      const trackEntityBounds = (entity, layerName, index) => {
        if (!entityTypeSizes[entity.type]) {
          entityTypeSizes[entity.type] = {
            count: 0,
            totalWidth: 0,
            totalHeight: 0,
            minWidth: Infinity,
            minHeight: Infinity,
            maxWidth: -Infinity,
            maxHeight: -Infinity,
            examples: []
          };
        }
        
        // Add to tracking
        entityTypeSizes[entity.type].count++;
        
        // For now just record the entity - we'll calculate bounds after all processing
        if (entityTypeSizes[entity.type].examples.length < 5) {
          entityTypeSizes[entity.type].examples.push({
            entity,
            layerName,
            index
          });
        }
      };
      
      // Iterate through all visible entities to find bounds
      Object.entries(dxfData).forEach(([layerName, entities]) => {
        if (layerVisibility && layerVisibility[layerName] === false) {
          console.log(`Skipping hidden layer: ${layerName} with ${entities.length} entities`);
          return; // Skip hidden layers
        }
        
        console.log(`Processing layer: ${layerName} with ${entities.length} entities}`);
        
        // Log a sample of the first entity in the layer to help debugging
        if (entities.length > 0) {
          console.log(`Sample entity from layer ${layerName}:`, entities[0]);
        }
        
        entities.forEach((entity, idx) => {
          try {
            // Track this entity for bounds analysis
            trackEntityBounds(entity, layerName, idx);
            
            // Process based on entity type
            const entityInfo = {
              type: entity.type,
              layer: layerName,
              index: idx,
              handle: entity.handle || 'unknown'
            };
            
            switch(entity.type) {
              case 'LINE':
                if (entity.start) updateBoundsFromPoint(entity.start, entityInfo);
                if (entity.end) updateBoundsFromPoint(entity.end, entityInfo);
                break;
                
              case 'CIRCLE':
                if (entity.center && typeof entity.radius === 'number') {
                  // Add center point to check for extremes
                  updateBoundsFromPoint(entity.center, entityInfo);
                  
                  // If center is within bounds, add the radius
                  if (!extremeCoordinates.some(ec => ec.entityInfo === entityInfo)) {
                    minX = Math.min(minX, entity.center[0] - entity.radius);
                    minY = Math.min(minY, entity.center[1] - entity.radius);
                    maxX = Math.max(maxX, entity.center[0] + entity.radius);
                    maxY = Math.max(maxY, entity.center[1] + entity.radius);
                    hasValidEntities = true;
                  }
                }
                break;
                
              case 'POINT':
                if (entity.location) {
                  updateBoundsFromPoint(entity.location, entityInfo);
                  
                  // If location is within bounds, add margin
                  if (!extremeCoordinates.some(ec => ec.entityInfo === entityInfo)) {
                    // Add a small margin around points for visibility
                    minX = Math.min(minX, entity.location[0] - 5);
                    minY = Math.min(minY, entity.location[1] - 5);
                    maxX = Math.max(maxX, entity.location[0] + 5);
                    maxY = Math.max(maxY, entity.location[1] + 5);
                  }
                }
                break;
                
              case 'ARC':
                if (entity.center && typeof entity.radius === 'number') {
                  // Add center point to check for extremes
                  updateBoundsFromPoint(entity.center, entityInfo);
                  
                  // If center is within bounds, add the radius
                  if (!extremeCoordinates.some(ec => ec.entityInfo === entityInfo)) {
                    minX = Math.min(minX, entity.center[0] - entity.radius);
                    minY = Math.min(minY, entity.center[1] - entity.radius);
                    maxX = Math.max(maxX, entity.center[0] + entity.radius);
                    maxY = Math.max(maxY, entity.center[1] + entity.radius);
                    hasValidEntities = true;
                  }
                }
                break;
                
              case 'ELLIPSE':
                if (entity.center && entity.major_axis) {
                  // Add center point to check for extremes
                  updateBoundsFromPoint(entity.center, entityInfo);
                  
                  // If center is within bounds, add the radius
                  if (!extremeCoordinates.some(ec => ec.entityInfo === entityInfo)) {
                    // Approximate ellipse bounds
                    const rx = Math.sqrt(entity.major_axis[0] ** 2 + entity.major_axis[1] ** 2);
                    const ry = rx * (entity.ratio || 1);
                    minX = Math.min(minX, entity.center[0] - rx);
                    minY = Math.min(minY, entity.center[1] - ry);
                    maxX = Math.max(maxX, entity.center[0] + rx);
                    maxY = Math.max(maxY, entity.center[1] + ry);
                    hasValidEntities = true;
                  }
                }
                break;
                
              case 'POLYLINE':
              case 'LWPOLYLINE':
                if (entity.points && Array.isArray(entity.points)) {
                  // Create flags for tracking if any points are extreme
                  let hasExtremePoints = false;
                  let hasValidPoints = false;
                  
                  // Check each point
                  entity.points.forEach(point => {
                    const before = extremeCoordinates.length;
                    updateBoundsFromPoint(point, entityInfo);
                    if (extremeCoordinates.length > before) {
                      hasExtremePoints = true;
                    } else {
                      hasValidPoints = true;
                    }
                  });
                  
                  // If all points are extreme, log warning
                  if (hasExtremePoints && !hasValidPoints) {
                    console.warn(`Skipping entire polyline with all extreme points:`, entity);
                  }
                }
                break;
                
              case 'SPLINE':
                if (entity.control_points && Array.isArray(entity.control_points)) {
                  // Create flags for tracking if any points are extreme
                  let hasExtremePoints = false;
                  let hasValidPoints = false;
                  
                  // Check each point
                  entity.control_points.forEach(point => {
                    const before = extremeCoordinates.length;
                    updateBoundsFromPoint(point, entityInfo);
                    if (extremeCoordinates.length > before) {
                      hasExtremePoints = true;
                    } else {
                      hasValidPoints = true;
                    }
                  });
                  
                  // If all points are extreme, log warning
                  if (hasExtremePoints && !hasValidPoints) {
                    console.warn(`Skipping entire spline with all extreme points:`, entity);
                  }
                }
                break;
                
              case 'TEXT':
              case 'MTEXT':
                if (entity.insert) {
                  updateBoundsFromPoint(entity.insert, entityInfo);
                  
                  // If insert point is within bounds, add appropriate margins for text
                  if (!extremeCoordinates.some(ec => ec.entityInfo === entityInfo)) {
                    const textHeight = entity.height || 10;
                    // Calculate approximate width based on text content and height
                    const textContent = entity.text || '';
                    
                    // More accurate text width estimation based on character count and height
                    // Different multipliers for different scripts/fonts
                    const avgCharWidth = textHeight * 0.6; // Approximate width-to-height ratio
                    const estimatedTextWidth = textContent.length * avgCharWidth;
                    
                    // Take into account text rotation
                    const rotation = entity.rotation || 0;
                    const isVertical = (rotation % 180) > 45 && (rotation % 180) < 135;
                    
                    if (isVertical) {
                      // For vertical text, height is the primary dimension
                      minX = Math.min(minX, entity.insert[0] - textHeight);
                      minY = Math.min(minY, entity.insert[1] - estimatedTextWidth/2);
                      maxX = Math.max(maxX, entity.insert[0] + textHeight);
                      maxY = Math.max(maxY, entity.insert[1] + estimatedTextWidth/2);
                    } else {
                      // For horizontal text, width is the primary dimension
                      minX = Math.min(minX, entity.insert[0] - estimatedTextWidth * 0.1); // Small left margin
                      minY = Math.min(minY, entity.insert[1] - textHeight * 1.2); // Margin above text
                      maxX = Math.max(maxX, entity.insert[0] + estimatedTextWidth * 1.1); // Right margin
                      maxY = Math.max(maxY, entity.insert[1] + textHeight * 0.3); // Small margin below baseline
                    }
                    
                    console.log(`Text entity bounds for "${textContent}"`, {
                      insert: entity.insert,
                      height: textHeight,
                      estimatedWidth: estimatedTextWidth,
                      rotation,
                      isVertical
                    });
                    
                    hasValidEntities = true;
                  }
                }
                break;
                
              case 'HATCH':
                // For hatch entities, just use any available point coordinates
                if (entity.center) updateBoundsFromPoint(entity.center, entityInfo);
                // A simple 10x10 rectangle as fallback for hatches only if needed
                if (!hasValidEntities && !extremeCoordinates.length) {
                  minX = Math.min(minX, 0);
                  minY = Math.min(minY, 0);
                  maxX = Math.max(maxX, 10);
                  maxY = Math.max(maxY, 10);
                  hasValidEntities = true;
                }
                break;
                
              default:
                // For any entity type not explicitly handled, look for common coordinate properties
                if (entity.start) updateBoundsFromPoint(entity.start, entityInfo);
                if (entity.end) updateBoundsFromPoint(entity.end, entityInfo);
                if (entity.center) updateBoundsFromPoint(entity.center, entityInfo);
                if (entity.location) updateBoundsFromPoint(entity.location, entityInfo);
                if (entity.insert) updateBoundsFromPoint(entity.insert, entityInfo);
                if (entity.points && Array.isArray(entity.points)) {
                  entity.points.forEach(point => updateBoundsFromPoint(point, entityInfo));
                }
                if (entity.vertices && Array.isArray(entity.vertices)) {
                  entity.vertices.forEach(point => updateBoundsFromPoint(point, entityInfo));
                }
                break;
            }
          } catch (entityError) {
            console.warn("Error processing entity bounds:", entityError, entity);
          }
        });
      });
      
      // Fallback to SVG bounding box if we couldn't determine bounds from entities
      if (!hasValidEntities || minX === Infinity || maxX === -Infinity) {
        // First, try to use a reasonable default bound based on all entity data
        if (Object.keys(dxfData).length > 0) {
          const totalEntityCount = Object.values(dxfData).reduce((sum, entities) => sum + entities.length, 0);
          if (totalEntityCount > 0) {
            console.log("Using default bounds for", totalEntityCount, "entities");
            minX = -50;
            minY = -50;
            maxX = 50;
            maxY = 50;
            hasValidEntities = true;
          }
        }
        
        // If still no valid entities, try SVG bounding box
        if (!hasValidEntities) {
          try {
            const svg = svgRef.current;
            const bbox = svg.getBBox();
            
            if (bbox.width > 0 && bbox.height > 0) {
              minX = bbox.x;
              minY = bbox.y;
              maxX = bbox.x + bbox.width;
              maxY = bbox.y + bbox.height;
              hasValidEntities = true;
            }
          } catch (bboxError) {
            console.warn("Error getting SVG bounding box:", bboxError);
          }
        }
        
        // Last resort default bounds
        if (!hasValidEntities) {
          minX = -50;
          minY = -50;
          maxX = 50;
          maxY = 50;
        }
      }
      
      // Ensure we have a reasonable size (avoid tiny or zero dimensions)
      let boundsWidth = maxX - minX;
      let boundsHeight = maxY - minY;
      
      // If dimensions are unreasonably small, use defaults
      if (boundsWidth < 1 || boundsHeight < 1) {
        console.warn("Detected unreasonably small dimensions, using defaults");
        minX = -50;
        minY = -50;
        maxX = 50;
        maxY = 50;
        boundsWidth = 100;
        boundsHeight = 100;
      }
      
      // Apply percentage-based padding (different for each dimension)
      const paddingPercent = rendererConfig.canvas?.rendering?.boundsPadding || 0.05;
      const paddingX = boundsWidth * paddingPercent;
      const paddingY = boundsHeight * paddingPercent;
      
      console.log("Original bounds before padding:", {
        minX, minY, maxX, maxY, width: boundsWidth, height: boundsHeight
      });
      
      // Adjust bounds with dimension-specific padding
      minX -= paddingX;
      minY -= paddingY;
      maxX += paddingX;
      maxY += paddingY;
      
      // Recalculate width and height with padding
      boundsWidth = maxX - minX;
      boundsHeight = maxY - minY;
      
      console.log("Bounds after padding:", {
        minX, minY, maxX, maxY, width: boundsWidth, height: boundsHeight
      });
      
      // Summarize extreme coordinates
      if (extremeCoordinates.length > 0) {
        console.warn(`Filtered out ${extremeCoordinates.length} extreme coordinates that would have created a massive bounding box`);
        
        // Group by layer for a cleaner summary
        const byLayer = extremeCoordinates.reduce((acc, item) => {
          const layer = item.entityInfo?.layer || 'unknown';
          acc[layer] = (acc[layer] || 0) + 1;
          return acc;
        }, {});
        
        console.warn("Extreme coordinates by layer:", byLayer);
        
        // Log the most extreme coordinates
        if (extremeCoordinates.length > 0) {
          const mostExtreme = extremeCoordinates.reduce((max, current) => {
            const currentMagnitude = Math.max(
              Math.abs(current.coords[0]), 
              Math.abs(current.coords[1])
            );
            const maxMagnitude = Math.max(
              Math.abs(max.coords[0]), 
              Math.abs(max.coords[1])
            );
            return currentMagnitude > maxMagnitude ? current : max;
          }, extremeCoordinates[0]);
          
          console.warn("Most extreme coordinate:", mostExtreme);
        }
      }
      
      // Calculate bounding box dimensions based on actual content extents
      let boundWidth = maxX - minX;
      let boundHeight = maxY - minY;
      
      // Initial bounding box calculation (will be updated later if needed)
      // We'll use this as our starting point but may modify it for special cases
      const newBoundingBox = {
        minX,
        minY,
        width: boundsWidth,
        height: boundsHeight
      };
      
      // Store in state for the current render
      setBoundingBox(newBoundingBox);
      
      // Check if we have entities with suspiciously large extents
      console.log("Looking for entities with suspiciously large contributions to the bounding box...");
      
      // Function to detect if a specific entity might be causing an oversized bounding box
      const detectInvalidEntities = () => {
        let invalidEntitiesFound = false;
        const totalBoundsArea = boundsWidth * boundsHeight;
        
        if (boundsWidth > 1000 || boundsHeight > 1000) {
          // Get the diagonal length of the bounding box
          const diagonal = Math.sqrt(boundsWidth * boundsWidth + boundsHeight * boundsHeight);
          
          // Calculate the average entity dimension based on count
          const entityCount = Object.values(entityTypeCount).reduce((sum, count) => sum + count, 0);
          const avgEntitySizeEstimate = diagonal / Math.max(1, Math.sqrt(entityCount));
          
          console.log(`Bounding box is unusually large: ${boundsWidth} x ${boundsHeight} (diagonal: ${diagonal})`);
          console.log(`Average entity size estimate: ${avgEntitySizeEstimate}`);
          
          // Loop through all entities to find any that contribute more than 80% to the bounding box size
          Object.entries(entityTypeSizes).forEach(([type, stats]) => {
            stats.examples.forEach(example => {
              // For line entities, check if they're excessively long
              if (type === 'LINE' || type === 'LWPOLYLINE' || type === 'POLYLINE') {
                const entity = example.entity;
                if (type === 'LINE' && entity.start && entity.end) {
                  const dx = entity.end[0] - entity.start[0];
                  const dy = entity.end[1] - entity.start[1];
                  const lineLength = Math.sqrt(dx*dx + dy*dy);
                  
                  if (lineLength > diagonal * 0.5) {
                    invalidEntitiesFound = true;
                    console.warn(`Found suspiciously long LINE entity in layer ${example.layerName}:`, 
                      { handle: entity.handle, length: lineLength, start: entity.start, end: entity.end });
                  }
                }
                else if ((type === 'LWPOLYLINE' || type === 'POLYLINE') && Array.isArray(entity.points)) {
                  // For polylines, check the max distance between any two points
                  let maxDist = 0;
                  for (let i = 0; i < entity.points.length; i++) {
                    for (let j = i+1; j < entity.points.length; j++) {
                      const dx = entity.points[i][0] - entity.points[j][0];
                      const dy = entity.points[i][1] - entity.points[j][1];
                      const dist = Math.sqrt(dx*dx + dy*dy);
                      maxDist = Math.max(maxDist, dist);
                    }
                  }
                  
                  if (maxDist > diagonal * 0.5) {
                    invalidEntitiesFound = true;
                    console.warn(`Found suspiciously large POLYLINE entity in layer ${example.layerName}:`, 
                      { handle: entity.handle, maxDistance: maxDist, pointCount: entity.points.length });
                  }
                }
              }
            });
          });
        }
        
        return invalidEntitiesFound;
      };
      
      // Check for invalid entities that might be creating an oversized bounding box
      const hasInvalidEntities = detectInvalidEntities();
      
      // Check if we have a very narrow bounding box, which could happen with text
      const minDimension = rendererConfig.canvas?.rendering?.minimumEntitySize || 10;
      const minTextBoxSize = rendererConfig.canvas?.rendering?.minTextBoxSize || 50;
      const textPadding = rendererConfig.canvas?.rendering?.textPadding || 0.5;
      const aspectRatio = boundsWidth / boundsHeight;
      
      // Check for excessively narrow dimensions, extreme aspect ratios, or invalid entities
      if (boundsWidth < minDimension || boundsHeight < minDimension || 
          aspectRatio > 10 || aspectRatio < 0.1 || hasInvalidEntities) {
        
        console.log("Detected narrow or extreme aspect ratio bounding box, adjusting for better visibility");
        
        // Handle case where we've found problematic entities creating a huge bounding box
        if (hasInvalidEntities) {
          console.warn("Applying special handling for invalid entities that are creating oversized bounding box");
          
          // Calculate a more reasonable bounding box based on the average entity dimensions
          // First, get the visible center of most entities by taking the median of all coordinates
          const allValidCoordinates = {
            x: [],
            y: []
          };
          
          Object.entries(entityTypeSizes).forEach(([type, stats]) => {
            stats.examples.forEach(example => {
              const entity = example.entity;
              
              // Skip the problematic entities we found earlier
              if ((type === 'LINE' && entity.start && entity.end) ||
                  ((type === 'LWPOLYLINE' || type === 'POLYLINE') && Array.isArray(entity.points))) {
                // Skip this one if it's a suspicious entity
                return;
              }
              
              // Extract coordinates based on entity type
              if (type === 'TEXT' || type === 'MTEXT') {
                if (entity.insert) {
                  allValidCoordinates.x.push(entity.insert[0]);
                  allValidCoordinates.y.push(entity.insert[1]);
                }
              } else if (type === 'CIRCLE') {
                if (entity.center) {
                  allValidCoordinates.x.push(entity.center[0]);
                  allValidCoordinates.y.push(entity.center[1]);
                }
              } else if (type === 'POINT') {
                if (entity.location) {
                  allValidCoordinates.x.push(entity.location[0]);
                  allValidCoordinates.y.push(entity.location[1]);
                }
              }
            });
          });
          
          // Only proceed if we found some valid coordinates
          if (allValidCoordinates.x.length > 0) {
            // Sort to find median X and Y
            allValidCoordinates.x.sort((a, b) => a - b);
            allValidCoordinates.y.sort((a, b) => a - b);
            
            const medianX = allValidCoordinates.x[Math.floor(allValidCoordinates.x.length / 2)];
            const medianY = allValidCoordinates.y[Math.floor(allValidCoordinates.y.length / 2)];
            
            console.log(`Found median entity center: (${medianX}, ${medianY}) from ${allValidCoordinates.x.length} coordinates`);
            
            // Use a reasonable box size around this median point
            const safeBoxSize = 100; // A reasonable default size
            minX = medianX - safeBoxSize;
            minY = medianY - safeBoxSize;
            maxX = medianX + safeBoxSize;
            maxY = medianY + safeBoxSize;
            
            // Update bounds
            boundWidth = maxX - minX;
            boundHeight = maxY - minY;
            
            console.log(`Used safe fallback bounding box: [${minX}, ${minY}] to [${maxX}, ${maxY}]`);
          }
        }
        // For text-heavy files, we'll create a more balanced bounding box
        else if (isTextHeavyFile) {
          // Create a more balanced box for text content - make it more square-ish
          const maxDim = Math.max(boundsWidth, boundsHeight, minTextBoxSize);
          const padding = maxDim * textPadding; // Generous padding around text
          
          // Center the content within a more balanced box
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          
          minX = centerX - maxDim / 2 - padding;
          minY = centerY - maxDim / 2 - padding;
          maxX = centerX + maxDim / 2 + padding;
          maxY = centerY + maxDim / 2 + padding;
          
          // Recalculate dimensions
          const adjustedWidth = maxX - minX;
          const adjustedHeight = maxY - minY;
          
          console.log("Adjusted bounding box for text:", {
            originalDimensions: { width: boundsWidth, height: boundsHeight },
            adjustedDimensions: { width: adjustedWidth, height: adjustedHeight },
            center: { x: centerX, y: centerY }
          });
          
          // Update the bounding dimensions
          boundWidth = adjustedWidth;
          boundHeight = adjustedHeight;
        } else {
          // For non-text files with narrow dimensions, just enforce a minimum size
          if (boundsWidth < minDimension) {
            const center = (minX + maxX) / 2;
            minX = center - minDimension / 2;
            maxX = center + minDimension / 2;
            boundWidth = minDimension; // Update boundWidth not boundsWidth
          }
          
          if (boundsHeight < minDimension) {
            const center = (minY + maxY) / 2;
            minY = center - minDimension / 2;
            maxY = center + minDimension / 2;
            boundHeight = minDimension; // Update boundHeight not boundsHeight
          }
        }
      }
      
      // Store the calculated bounds in a format that's easy to use for rendering
      // This will be used for drawing the bounding box, regardless of canvas resizing
      originalBoundsRef.current = {
        minX,
        minY,
        width: boundWidth, // Use the possibly adjusted boundWidth
        height: boundHeight // Use the possibly adjusted boundHeight
      };
      
      // Log entity type statistics for debugging
      console.log("Entity type statistics:");
      Object.entries(entityTypeSizes).forEach(([type, stats]) => {
        console.log(`Type ${type}:`, {
          count: stats.count,
          examples: stats.examples
        });
      });
      
      // Log the final bounding box dimensions including aspect ratio
      const finalBboxMessage = `Final bounding box: ${boundWidth.toFixed(2)} x ${boundHeight.toFixed(2)} (ratio: ${(boundWidth / boundHeight).toFixed(2)}) at [${minX.toFixed(2)}, ${minY.toFixed(2)}] to [${maxX.toFixed(2)}, ${maxY.toFixed(2)}]`;
      console.log(finalBboxMessage);
      console.log("Complete bounding box data:", {
        width: boundWidth, // Using the possibly adjusted value
        height: boundHeight, // Using the possibly adjusted value
        aspectRatio: boundWidth / boundHeight,
        extents: { 
          minX, 
          minY, 
          maxX, 
          maxY 
        }
      });
      
      // Add to window debug logs if available
      if (typeof window !== 'undefined' && window._debugLogs) {
        window._debugLogs.push({
          type: 'bounds-final',
          message: finalBboxMessage,
          timestamp: new Date().toISOString()
        });
      }
      
      // Log bounding box for debugging
      console.log("Setting bounding box to:", newBoundingBox);
      console.log("Storing original bounds in ref:", originalBoundsRef.current);
      
      // Set SVG viewBox first to ensure proper rendering
      if (svgRef.current) {
        svgRef.current.setAttribute('viewBox', `${minX} ${minY} ${boundWidth} ${boundHeight}`);
        
        // Use preserveAspectRatio to maintain aspect ratio during resizing if enabled in config
        // xMidYMid meet = center the viewBox within the SVG element, preserving aspect ratio
        const preserveAspectRatio = rendererConfig.canvas?.rendering?.preserveAspectRatio !== false;
        svgRef.current.setAttribute('preserveAspectRatio', preserveAspectRatio ? 'xMidYMid meet' : 'none');
        
        // Store the original bounds as data attributes on the SVG
        svgRef.current.dataset.originalMinX = minX.toString();
        svgRef.current.dataset.originalMinY = minY.toString();
        svgRef.current.dataset.originalWidth = boundWidth.toString();
        svgRef.current.dataset.originalHeight = boundHeight.toString();
      }
      
      // We'll defer actual zooming and centering to a separate step
      // Just ensure the SVG viewBox matches the calculated bounds
      if (svgRef.current) {
        svgRef.current.setAttribute('viewBox', `${minX} ${minY} ${boundWidth} ${boundHeight}`);
      }
      
      // Store the container dimensions for later use
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        containerDimensionsRef.current = {
          width: rect.width,
          height: rect.height
        };
      }
      
      // We'll determine the appropriate zoom and position later
      // This separation helps ensure the viewBox is properly set before zooming
      
      // Mark initial fit as done, but don't finalize until we explicitly center
      setInitialFitDone(true);
      console.log("Content auto-fitted with bounds:", { minX, minY, maxX, maxY, fitZoom });
      
      // Add a small delay to make sure everything is initialized properly
      setTimeout(() => {
        centerContent();
      }, 50);
      
      // Return from function to prevent further processing
      return;
    } catch (e) {
      console.error("Error auto-fitting content:", e);
      
      // Emergency fallback - set a reasonable default viewBox
      if (svgRef.current) {
        const minX = -25;
        const minY = -25;
        const width = 50;
        const height = 50;
        
        svgRef.current.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
        
        // Update bounding box for the green outline
        const newBoundingBox = {
          minX,
          minY,
          width,
          height
        };
        setBoundingBox(newBoundingBox);
        originalBoundsRef.current = newBoundingBox;
        console.log("Emergency fallback bounding box:", newBoundingBox);
        
        setInitialFitDone(true);
        
        // Even in emergency mode, try to center the content
        setTimeout(() => {
          centerContent();
        }, 50);
      }
    }
  }, [dxfData, layerVisibility, centerContent]);
  
  // Fit content when dxfData changes
  useEffect(() => {
    if (dxfData && !initialFitDone) {
      // Allow time for SVG to render before calculating fit
      const timer = setTimeout(() => {
        autoFitContent();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dxfData, initialFitDone, autoFitContent]);
  
  // Additional effect to update SVG viewBox when originalBoundsRef changes
  useEffect(() => {
    if (svgRef.current && originalBoundsRef.current) {
      const bounds = originalBoundsRef.current;
      
      // Always preserve the exact aspect ratio of the content bounds
      svgRef.current.setAttribute('viewBox', 
        `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`);
      
      // Set preserveAspectRatio to maintain the aspect ratio
      svgRef.current.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      
      console.log("Updated SVG viewBox to match bounds:", bounds);
    }
  }, [originalBoundsRef.current?.width, originalBoundsRef.current?.height]);
  
  // Additional effect to ensure content is centered after component mounts
  useEffect(() => {
    if (dxfData && svgRef.current && containerRef.current) {
      // Wait for the component to be fully rendered
      const timer = setTimeout(() => {
        centerContent();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [dxfData, centerContent]);
  
  // Add resize observer to handle container resizing and maintain aspect ratio
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Update container dimensions on first render
    const rect = containerRef.current.getBoundingClientRect();
    containerDimensionsRef.current = {
      width: rect.width,
      height: rect.height
    };
    
    // Create resize observer to track container size changes
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        
        // Only update if dimensions actually changed
        if (newWidth !== containerDimensionsRef.current.width || 
            newHeight !== containerDimensionsRef.current.height) {
          
          console.log(`Container resized: ${newWidth}x${newHeight}`);
          
          // Update the ref with new dimensions
          containerDimensionsRef.current = {
            width: newWidth,
            height: newHeight
          };
          
          // If we have calculated original bounds, ensure they're preserved
          if (originalBoundsRef.current && svgRef.current) {
            // No need to recompute bounds - just update the view to maintain aspect ratio
            // This ensures the bounding box doesn't change shape during resize
            const boundingBox = originalBoundsRef.current;
            
            // Recalculate the view scale and position to maintain the same visible area
            // Calculate appropriate zoom level to fit with the new dimensions
            if (boundingBox.width > 0 && boundingBox.height > 0) {
              const widthRatio = newWidth / boundingBox.width;
              const heightRatio = newHeight / boundingBox.height;
              const scalingFactor = rendererConfig.canvas?.rendering?.boundsScalingFactor || 3.0;
              const fitZoom = Math.min(widthRatio, heightRatio) * scalingFactor;
              
              // Center the content with the new container size
              setZoom(fitZoom);
              setOffset({
                x: (newWidth - boundingBox.width * fitZoom) / 2 - boundingBox.minX * fitZoom,
                y: (newHeight - boundingBox.height * fitZoom) / 2 - boundingBox.minY * fitZoom,
              });
            }
            
            console.log("Preserving original bounding box after resize:", boundingBox);
          }
        }
      }
    });
    
    // Start observing the container
    resizeObserver.observe(containerRef.current);
    
    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Event handlers for panning and zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? canvasConfig.ZOOM_IN_FACTOR : canvasConfig.ZOOM_OUT_FACTOR;
    const newZoom = Math.min(Math.max(zoom * factor, canvasConfig.MIN_ZOOM), canvasConfig.MAX_ZOOM);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      // Calculate cursor position relative to the SVG element
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      // Calculate the SVG coordinates under the cursor before zooming
      // This creates a more natural zoom (centered on cursor)
      const svgPoint = {
        x: (mx - offset.x) / zoom,
        y: (my - offset.y) / zoom
      };
      
      // Calculate new offset to keep the cursor over the same SVG point
      const newOffsetX = mx - svgPoint.x * newZoom;
      const newOffsetY = my - svgPoint.y * newZoom;
      
      // Update offset for position after zoom
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
    
    setZoom(newZoom);
    
    // Make sure our SVG viewBox doesn't change during zoom
    if (svgRef.current && originalBoundsRef.current) {
      const bounds = originalBoundsRef.current;
      svgRef.current.setAttribute('viewBox', `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start panning on middle mouse button or if holding space
    if (e.button === 1 || e.button === 0) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      offsetStart.current = offset;
    }
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

  // Handle entity selection
  const handleEntitySelect = (layerName: string, entityType: string, entityIndex: number, entity: any) => {
    if (!onFeatureSelect) return;
    
    // If selecting the same entity, deselect it
    if (selectedFeature && 
        selectedFeature.layerName === layerName && 
        selectedFeature.entityType === entityType && 
        selectedFeature.entityIndex === entityIndex) {
      onFeatureSelect(null);
    } else {
      const feature: SelectedFeature = {
        layerName,
        entityType,
        entityIndex,
        entity
      };
      onFeatureSelect(feature);
    }
  };

  // If no data, show placeholder
  if (!dxfData) {
    return (
      <div className="flex items-center justify-center w-full h-full text-gray-500 text-xl">
        No DXF file loaded
      </div>
    );
  }

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
        cursor: isPanning ? "grabbing" : "pointer",
        backgroundColor: canvasConfig.BACKGROUND_COLOR,
        boxShadow: themeComponents.canvas.shadow
      }}
    >
      {/* Zoom and pan controls */}
      <div className="absolute top-2 left-2 z-10 flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newZoom = Math.min(zoom * canvasConfig.ZOOM_IN_FACTOR, canvasConfig.MAX_ZOOM);
            
            // Zoom toward center of viewport
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              
              // Calculate the SVG point at the center
              const svgPoint = {
                x: (centerX - offset.x) / zoom,
                y: (centerY - offset.y) / zoom
              };
              
              // Calculate new offset to keep the center point fixed
              const newOffsetX = centerX - svgPoint.x * newZoom;
              const newOffsetY = centerY - svgPoint.y * newZoom;
              
              setOffset({ x: newOffsetX, y: newOffsetY });
            }
            
            setZoom(newZoom);
          }}
          className="p-1 rounded"
          style={{
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
            const newZoom = Math.max(zoom * canvasConfig.ZOOM_OUT_FACTOR, canvasConfig.MIN_ZOOM);
            
            // Zoom from center of viewport
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              
              // Calculate the SVG point at the center
              const svgPoint = {
                x: (centerX - offset.x) / zoom,
                y: (centerY - offset.y) / zoom
              };
              
              // Calculate new offset to keep the center point fixed
              const newOffsetX = centerX - svgPoint.x * newZoom;
              const newOffsetY = centerY - svgPoint.y * newZoom;
              
              setOffset({ x: newOffsetX, y: newOffsetY });
            }
            
            setZoom(newZoom);
          }}
          className="p-1 rounded"
          style={{
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
            // Reset zoom and properly center the entire bounding box
            if (containerRef.current && svgRef.current && originalBoundsRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const bounds = originalBoundsRef.current;
              
              // Calculate the center of the bounding box
              const boxCenterX = bounds.minX + bounds.width / 2;
              const boxCenterY = bounds.minY + bounds.height / 2;
              
              // Calculate zoom level to fit entire bounding box with margin
              const margin = 0.8; // Show bounding box at 80% of container size (20% margin)
              const widthRatio = (rect.width * margin) / bounds.width;
              const heightRatio = (rect.height * margin) / bounds.height;
              const fitZoom = Math.min(widthRatio, heightRatio);
              
              // Ensure zoom isn't too small or too large
              const newZoom = Math.min(
                Math.max(fitZoom, canvasConfig.MIN_ZOOM), 
                canvasConfig.MAX_ZOOM
              );
              
              // Calculate offset to center the bounding box
              const newOffsetX = rect.width / 2 - boxCenterX * newZoom;
              const newOffsetY = rect.height / 2 - boxCenterY * newZoom;
              
              console.log("Reset view:", {
                containerSize: { width: rect.width, height: rect.height },
                bounds: bounds,
                boxCenter: { x: boxCenterX, y: boxCenterY },
                zoom: newZoom,
                offset: { x: newOffsetX, y: newOffsetY }
              });
              
              setZoom(newZoom);
              setOffset({ x: newOffsetX, y: newOffsetY });
            } else {
              // Fallback if refs aren't ready
              setZoom(canvasConfig.INITIAL_ZOOM);
              setOffset({ x: 0, y: 0 });
            }
          }}
          className="p-1 rounded"
          style={{
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
            setInitialFitDone(false); // Reset to trigger full recalculation
            
            // Recalculate bounds then zoom to fit
            autoFitContent();
            
            // Add a delay to let the viewBox and bounds update before centering
            setTimeout(() => {
              if (containerRef.current && svgRef.current && originalBoundsRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const bounds = originalBoundsRef.current;
                
                // Calculate the center of the bounding box
                const boxCenterX = bounds.minX + bounds.width / 2;
                const boxCenterY = bounds.minY + bounds.height / 2;
                
                // Calculate zoom level to fit entire bounding box with margin
                const margin = 0.8; // Show bounding box at 80% of container size (20% margin)
                const widthRatio = (rect.width * margin) / bounds.width;
                const heightRatio = (rect.height * margin) / bounds.height;
                const fitZoom = Math.min(widthRatio, heightRatio);
                
                // Apply scaling factor but don't make it too large
                const scalingFactor = rendererConfig.canvas?.rendering?.boundsScalingFactor || 1.0;
                // Cap the scaling factor at 1.5 for the fit view functionality to avoid excessive zoom
                const cappedScalingFactor = Math.min(scalingFactor, 1.5);
                
                // Ensure zoom isn't too small or too large
                const newZoom = Math.min(
                  Math.max(fitZoom * cappedScalingFactor, canvasConfig.MIN_ZOOM), 
                  canvasConfig.MAX_ZOOM
                );
                
                // Calculate offset to center the bounding box
                const newOffsetX = rect.width / 2 - boxCenterX * newZoom;
                const newOffsetY = rect.height / 2 - boxCenterY * newZoom;
                
                console.log("Fit to view:", {
                  containerSize: { width: rect.width, height: rect.height },
                  bounds: bounds,
                  boxCenter: { x: boxCenterX, y: boxCenterY },
                  zoom: newZoom,
                  offset: { x: newOffsetX, y: newOffsetY }
                });
                
                setZoom(newZoom);
                setOffset({ x: newOffsetX, y: newOffsetY });
              } else {
                // Fallback to original centering function
                centerContent();
              }
            }, 100);
          }}
          className="p-1 rounded ml-2"
          style={{
            backgroundColor: themeComponents.button.secondary.backgroundColor,
            color: themeComponents.button.secondary.textColor,
            borderRadius: themeComponents.button.secondary.borderRadius,
          }}
          title="Fit to View"
        >
          <span style={{ fontSize: "14px" }}>&#x1F50D;</span>
        </button>
      </div>

      {/* Main SVG canvas with transformations */}
      <svg
        ref={svgRef}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: "100%",
          height: "100%",
        }}
        viewBox="-25 -25 50 50"
        preserveAspectRatio={rendererConfig.canvas?.rendering?.preserveAspectRatio !== false ? 'xMidYMid meet' : 'none'}
      >
        {/* Bounding box to show the extents of all entities */}
        {dxfData && Object.keys(dxfData).length > 0 && (
          <>
            {/* Add a solid background to make it more visible */}
            <rect 
              x={originalBoundsRef.current.minX}
              y={originalBoundsRef.current.minY}
              width={originalBoundsRef.current.width}
              height={originalBoundsRef.current.height}
              fill={`rgba(${parseInt(rendererConfig.canvas?.colors?.boundingBox?.slice(1, 3) || "00", 16)}, ${parseInt(rendererConfig.canvas?.colors?.boundingBox?.slice(3, 5) || "FF", 16)}, ${parseInt(rendererConfig.canvas?.colors?.boundingBox?.slice(5, 7) || "00", 16)}, 0.05)`}
              pointerEvents="none"
            />
            {/* Add corner markers for more visibility */}
            <g>
              {/* Top-left */}
              <line 
                x1={originalBoundsRef.current.minX} 
                y1={originalBoundsRef.current.minY} 
                x2={originalBoundsRef.current.minX + 10} 
                y2={originalBoundsRef.current.minY} 
                stroke={rendererConfig.canvas?.colors?.boundingBox || "#00FF00"} 
                strokeWidth="3" 
              />
              <line 
                x1={originalBoundsRef.current.minX} 
                y1={originalBoundsRef.current.minY} 
                x2={originalBoundsRef.current.minX} 
                y2={originalBoundsRef.current.minY + 10} 
                stroke={rendererConfig.canvas?.colors?.boundingBox || "#00FF00"} 
                strokeWidth="3" 
              />
              
              {/* Top-right */}
              <line 
                x1={originalBoundsRef.current.minX + originalBoundsRef.current.width} 
                y1={originalBoundsRef.current.minY} 
                x2={originalBoundsRef.current.minX + originalBoundsRef.current.width - 10} 
                y2={originalBoundsRef.current.minY} 
                stroke={rendererConfig.canvas?.colors?.boundingBox || "#00FF00"} 
                strokeWidth="3" 
              />
              <line 
                x1={originalBoundsRef.current.minX + originalBoundsRef.current.width} 
                y1={originalBoundsRef.current.minY} 
                x2={originalBoundsRef.current.minX + originalBoundsRef.current.width} 
                y2={originalBoundsRef.current.minY + 10} 
                stroke={rendererConfig.canvas?.colors?.boundingBox || "#00FF00"} 
                strokeWidth="3" 
              />
              
              {/* Bottom-left */}
              <line 
                x1={originalBoundsRef.current.minX} 
                y1={originalBoundsRef.current.minY + originalBoundsRef.current.height} 
                x2={originalBoundsRef.current.minX + 10} 
                y2={originalBoundsRef.current.minY + originalBoundsRef.current.height} 
                stroke={rendererConfig.canvas?.colors?.boundingBox || "#00FF00"} 
                strokeWidth="3" 
              />
              <line 
                x1={originalBoundsRef.current.minX} 
                y1={originalBoundsRef.current.minY + originalBoundsRef.current.height} 
                x2={originalBoundsRef.current.minX} 
                y2={originalBoundsRef.current.minY + originalBoundsRef.current.height - 10} 
                stroke={rendererConfig.canvas?.colors?.boundingBox || "#00FF00"} 
                strokeWidth="3" 
              />
              
              {/* Bottom-right */}
              <line 
                x1={originalBoundsRef.current.minX + originalBoundsRef.current.width} 
                y1={originalBoundsRef.current.minY + originalBoundsRef.current.height} 
                x2={originalBoundsRef.current.minX + originalBoundsRef.current.width - 10} 
                y2={originalBoundsRef.current.minY + originalBoundsRef.current.height} 
                stroke={rendererConfig.canvas?.colors?.boundingBox || "#00FF00"} 
                strokeWidth="3" 
              />
              <line 
                x1={originalBoundsRef.current.minX + originalBoundsRef.current.width} 
                y1={originalBoundsRef.current.minY + originalBoundsRef.current.height} 
                x2={originalBoundsRef.current.minX + originalBoundsRef.current.width} 
                y2={originalBoundsRef.current.minY + originalBoundsRef.current.height - 10} 
                stroke={rendererConfig.canvas?.colors?.boundingBox || "#00FF00"} 
                strokeWidth="3" 
              />
            </g>
            
            {/* Main bounding box outline */}
            <rect
              x={originalBoundsRef.current.minX}
              y={originalBoundsRef.current.minY} 
              width={originalBoundsRef.current.width}
              height={originalBoundsRef.current.height}
              stroke={rendererConfig.canvas?.colors?.boundingBox || "#00FF00"}
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
              pointerEvents="none"
            />
          </>
        )}
        
        {/* Render each layer based on visibility */}
        {Object.entries(dxfData).map(([layerName, entities]) => {
          // Skip hidden layers
          if (layerVisibility && layerVisibility[layerName] === false) {
            return null;
          }

          return (
            <g 
              key={layerName} 
              data-layer={layerName}
              className="transition-opacity duration-200"
            >
              {/* Render each entity in the layer */}
              {entities.map((entity, index) => {
                // Check if this entity is selected
                const isSelected = selectedFeature &&
                  selectedFeature.layerName === layerName &&
                  selectedFeature.entityType === entity.type &&
                  selectedFeature.entityIndex === index;
                
                return (
                  <DxfEntity
                    key={`${layerName}-${entity.type}-${index}`}
                    entity={entity}
                    isSelected={!!isSelected}
                    onClick={() => handleEntitySelect(layerName, entity.type, index, entity)}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default DxfCanvas;