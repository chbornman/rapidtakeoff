/**
 * Utilities for handling coordinate transformations between canvas and DXF
 */

interface Viewport {
  width: number;
  height: number;
  scale: number;
  offset: { x: number; y: number };
}

interface Coordinates {
  x: number;
  y: number;
}

/**
 * Convert client (mouse) coordinates to SVG/drawing coordinates
 */
export function clientToSvgCoordinates(
  clientX: number, 
  clientY: number, 
  rect: DOMRect, 
  viewport: Viewport
): Coordinates {
  // Get mouse position in client coordinates
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;
  
  // Convert to SVG/drawing coordinates, taking into account the transform
  // We need to subtract the canvas center position as well as the offset
  // For Y coordinate, we negate the value because we flipped the Y axis in the transform
  const svgX = (mouseX - (viewport.width/2 + viewport.offset.x)) / viewport.scale;
  const svgY = -1 * (mouseY - (viewport.height/2 + viewport.offset.y)) / viewport.scale;
  
  return { x: svgX, y: svgY };
}

/**
 * Convert SVG/drawing coordinates to client (screen) coordinates
 */
export function svgToClientCoordinates(
  svgX: number,
  svgY: number,
  rect: DOMRect,
  viewport: Viewport
): Coordinates {
  // Convert SVG coordinates to client coordinates
  // Note the Y-axis flip in the SVG transform
  const clientX = (svgX * viewport.scale) + (viewport.width/2 + viewport.offset.x) + rect.left;
  const clientY = (-svgY * viewport.scale) + (viewport.height/2 + viewport.offset.y) + rect.top;
  
  return { x: clientX, y: clientY };
}