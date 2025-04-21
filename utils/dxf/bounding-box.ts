import { Entity } from '../../components/types';

/**
 * Calculate the bounding box for a collection of DXF entities
 */
export function calculateBoundingBox(entities: Entity[]) {
  if (!entities || entities.length === 0) {
    // Set a default bounding box centered on the origin
    return {
      minX: -10, minY: -10, maxX: 10, maxY: 10,
      width: 20, height: 20, centerX: 0, centerY: 0
    };
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

  // Add generous padding for initial view
  const padding = Math.max((maxX - minX) * 0.5, (maxY - minY) * 0.5, 50);
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;
  const centerX = minX + boxWidth / 2;
  const centerY = minY + boxHeight / 2;

  return { 
    minX, minY, maxX, maxY, 
    width: boxWidth, 
    height: boxHeight,
    centerX, 
    centerY 
  };
}