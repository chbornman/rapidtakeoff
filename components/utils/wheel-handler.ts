import { WheelHandlerOptions, WheelResult } from '../types';

/**
 * Handle mouse wheel events for canvas zooming with special handling for MX Master 3S
 * and similar high-precision mice.
 * 
 * @param e The wheel event
 * @param currentZoom The current zoom level
 * @param options Configuration options
 * @returns WheelResult with the zoom change and direction
 */
export function handleMouseWheel(
  e: WheelEvent, 
  currentZoom: number, 
  options: WheelHandlerOptions
): WheelResult | null {
  // Default values
  const {
    zoomInFactor,
    zoomOutFactor,
    minZoom,
    maxZoom,
    defaultDirection = 'in',
    zoomOutThreshold = 25,
    zoomInThreshold = 5,
    debug = false
  } = options;

  // MX Master 3S specific handling for more reliable zoom direction detection
  // Check all available delta values for better direction detection
  let deltaY = e.deltaY;
  let deltaX = e.deltaX;
  let wheelDirection = 0;
  
  // Also check deltaMode - some mice use line-based delta (1) or page-based delta (2)
  const multiplier = e.deltaMode === 1 ? 20 : (e.deltaMode === 2 ? 100 : 1);
  deltaY *= multiplier;
  
  // For MX Master, we'll REVERSE the default behavior:
  // - Small/ambiguous movements will default to zoom IN (the more common desire)
  // - Only very clearly downward movements will zoom OUT
  
  // Clear zoom OUT detection - must exceed higher threshold to zoom out
  if (deltaY > zoomOutThreshold) {
    wheelDirection = 1; // Zoom OUT - must be very clear downward movement
  } 
  // More sensitive zoom IN detection - lower threshold to zoom in
  else if (deltaY < -zoomInThreshold) {
    wheelDirection = -1; // Zoom IN - even slight upward movement
  }
  // For horizontal movement on MX Master
  else if (Math.abs(deltaX) > 15) {
    // For horizontal, we'll also bias toward zoom IN
    wheelDirection = deltaX > 15 ? 1 : -1; // Bias toward zoom IN
  }
  // Default to zoom IN for small/ambiguous movements
  else {
    // When in doubt, use the configured default direction
    wheelDirection = defaultDirection === 'out' ? 1 : -1;
  }
  
  // Log debugging information if enabled
  if (debug) {
    console.log(`Wheel event: deltaY=${e.deltaY}, deltaX=${e.deltaX}, mode=${e.deltaMode}, dir=${wheelDirection}`);
  }
  
  // Use EXACTLY one zoom step per wheel click
  // No sensitivity factor - each click moves exactly one zoom level
  const zoomChange = wheelDirection < 0 ? zoomInFactor : zoomOutFactor;
  
  // Calculate new zoom level with limits
  const newZoom = Math.min(Math.max(currentZoom * zoomChange, minZoom), maxZoom);
  
  // Skip if zoom barely changed
  if (Math.abs(newZoom - currentZoom) < 0.001) return null;
  
  return {
    zoomChange,
    wheelDirection,
    newZoom
  };
}

/**
 * Calculate new canvas offset based on zoom change
 * 
 * @param mx Mouse X position relative to container
 * @param my Mouse Y position relative to container 
 * @param currentOffset Current canvas offset
 * @param currentZoom Current zoom level
 * @param newZoom New zoom level
 * @returns New offset object {x, y}
 */
export function calculateZoomOffset(
  mx: number,
  my: number,
  currentOffset: { x: number; y: number },
  currentZoom: number,
  newZoom: number
): { x: number; y: number } {
  // Calculate the SVG coordinates under the cursor before zooming
  // This creates a more natural zoom (centered on cursor)
  const svgPoint = {
    x: (mx - currentOffset.x) / currentZoom,
    y: (my - currentOffset.y) / currentZoom
  };
  
  // Calculate new offset to keep the cursor over the same SVG point
  return {
    x: mx - svgPoint.x * newZoom,
    y: my - svgPoint.y * newZoom
  };
}