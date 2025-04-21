import React from 'react';
import { Entity } from '../types';

interface GenericEntityProps {
  entity: Entity;
  isSelected: boolean;
  onClick: () => void;
  /** Optional renderer configuration for styling */
  rendererConfig?: any;
}

const GenericEntity: React.FC<GenericEntityProps> = ({ entity, isSelected, onClick, rendererConfig }) => {
  // Fallback renderer for any unsupported entity type:
  // Collect any 2D coordinate-like arrays on the entity
  const coords: [number, number][] = [];
  Object.keys(entity).forEach((key) => {
    const val = (entity as any)[key];
    if (Array.isArray(val)) {
      // Single point [x, y, ...]
      if (typeof val[0] === 'number' && typeof val[1] === 'number') {
        coords.push([val[0], val[1]]);
      }
      // Array of points [[x,y,...], ...]
      else if (
        val.length > 0 &&
        Array.isArray(val[0]) &&
        typeof (val[0] as any)[0] === 'number' &&
        typeof (val[0] as any)[1] === 'number'
      ) {
        (val as any[]).forEach((pt: any) => {
          if (Array.isArray(pt) && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
            coords.push([pt[0], pt[1]]);
          }
        });
      }
    }
  });
  // Nothing to draw
  if (coords.length === 0) {
    console.warn(`GenericEntity: no drawable coords for type ${entity.type}`);
    return null;
  }
  // Styling defaults - brighter colors for dark background
  const defaultColor = rendererConfig?.canvas?.colors?.default || '#FFFFFF';
  // Use entity's own color if available
  const entityColor = entity.rgb || defaultColor;
  const strokeColor = isSelected
    ? rendererConfig?.canvas?.colors?.selection || '#FF9900'
    : entityColor;
  const strokeWidth = isSelected ? 2 : 1;
  // Single point: render small circle (wireframe style)
  if (coords.length === 1) {
    const [x, y] = coords[0];
    return (
      <circle
        cx={x}
        cy={y}
        r={strokeWidth * 2}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        onClick={onClick}
        data-entity-type={entity.type}
        data-entity-handle={(entity as any).handle}
        data-layer={(entity as any).layer}
      />
    );
  }
  // Multiple points: render a polyline
  const pointsAttr = coords.map((p) => `${p[0]},${p[1]}`).join(' ');
  return (
    <polyline
      points={pointsAttr}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill="none"
      onClick={onClick}
      data-entity-type={entity.type}
      data-entity-handle={(entity as any).handle}
      data-layer={(entity as any).layer}
    />
  );
};

export default GenericEntity;