import React from 'react';
import { PolylineEntity as PolylineEntityType } from '../types';

interface PolylineEntityProps {
  entity: PolylineEntityType;
  isSelected: boolean;
  onClick: () => void;
  /** Optional renderer configuration for styling */
  rendererConfig?: any;
}

const PolylineEntity: React.FC<PolylineEntityProps> = ({ entity, isSelected, onClick, rendererConfig }) => {
  const { points, closed } = entity;
  
  // Format points for SVG polyline
  const pointsString = points.map(point => `${point[0]},${point[1]}`).join(' ');
  
  // Determine styling from rendererConfig
  const typeKey = entity.type.toLowerCase();
  const entitiesConfig = rendererConfig?.entities || {};
  const entityConfig = entitiesConfig[typeKey] || {};
  const canvasEntityCfg = rendererConfig?.canvas?.entity;
  const defaultStrokeWidth = canvasEntityCfg?.strokeWidth?.default ?? 1;
  const selectedStrokeWidth = canvasEntityCfg?.strokeWidth?.selected ?? defaultStrokeWidth + 1;
  const defaultColor = entityConfig.color || rendererConfig?.canvas?.colors?.default || '#FFFFFF';
  const selectionColor = rendererConfig?.canvas?.colors?.selection || '#FF0000';
  const strokeColor = isSelected ? selectionColor : defaultColor;
  const strokeWidth = isSelected ? selectedStrokeWidth : defaultStrokeWidth;

  if (closed) {
    // For closed polylines, use polygon
    return (
      <polygon
        points={pointsString}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill={strokeColor}
        onClick={onClick}
        data-entity-type={entity.type}
        data-entity-handle={entity.handle}
        data-layer={entity.layer}
        className="cursor-pointer transition-colors duration-150"
      />
    );
  }
  
  // For open polylines
  return (
    <polyline
      points={pointsString}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill={strokeColor}
      onClick={onClick}
      data-entity-type={entity.type}
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="cursor-pointer transition-colors duration-150"
    />
  );
};

export default PolylineEntity;