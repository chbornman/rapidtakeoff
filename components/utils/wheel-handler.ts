/**
 * Enhanced wheel handler for canvas zooming with better behavior
 */

interface WheelHandlerOptions {
  event: React.WheelEvent<SVGSVGElement>;
  currentScale: number;
  currentOffset: { x: number; y: number };
  minScale: number;
  maxScale: number;
  zoomFactor?: number;
}

interface WheelHandlerResult {
  newScale: number;
  newOffset: { x: number; y: number };
}

/**
 * Process wheel events for zooming with proper focus point
 */
export const handleWheel = ({
  event,
  currentScale,
  currentOffset,
  minScale = 0.1,
  maxScale = 100,
  zoomFactor = 0.1,
}: WheelHandlerOptions): WheelHandlerResult => {
  // Note: We can't use preventDefault in passive event listeners
  // The touchAction: 'none' style should handle this behavior instead
  
  // Get mouse position relative to the SVG element
  const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  // Calculate zoom direction and amount
  const direction = event.deltaY > 0 ? -1 : 1;
  const factor = direction > 0 ? (1 + zoomFactor) : (1 / (1 + zoomFactor));
  
  // Calculate new scale with limits
  let newScale = currentScale * factor;
  newScale = Math.max(minScale, Math.min(maxScale, newScale));
  
  // Calculate offset to zoom toward mouse position
  const scaleDelta = newScale / currentScale;
  
  // Calculate center of viewport
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  // Calculate mouse position relative to center (this is important for proper scaling behavior)
  const mouseOffsetX = mouseX - centerX;
  const mouseOffsetY = mouseY - centerY;
  
  // Calculate new offset that maintains the point under the cursor
  const newOffset = {
    x: currentOffset.x - mouseOffsetX * (scaleDelta - 1),
    y: currentOffset.y - mouseOffsetY * (scaleDelta - 1)
  };
  
  return { newScale, newOffset };
};

/**
 * Calculate appropriate initial scale to fit a bounding box
 */
export const calculateInitialScale = (
  boundingBox: { width: number; height: number },
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 0.1
): number => {
  // Add padding
  const paddedWidth = boundingBox.width * (1 + padding * 2);
  const paddedHeight = boundingBox.height * (1 + padding * 2);
  
  // Calculate scale based on both dimensions
  const scaleX = viewportWidth / paddedWidth;
  const scaleY = viewportHeight / paddedHeight;
  
  // Use the smaller scale to ensure everything fits
  return Math.min(scaleX, scaleY);
};

/**
 * Calculate center offset for given bounding box and scale
 */
export const calculateCenterOffset = (
  boundingBox: { 
    centerX: number; 
    centerY: number; 
  },
  viewportWidth: number,
  viewportHeight: number,
  scale: number
): { x: number; y: number } => {
  return {
    x: viewportWidth / 2 - boundingBox.centerX * scale,
    y: viewportHeight / 2 + boundingBox.centerY * scale // Y is flipped in SVG
  };
};