import React from 'react';
import { SplineEntity as SplineEntityType } from '../types';

interface SplineEntityProps {
  entity: SplineEntityType;
  isSelected: boolean;
  onClick: () => void;
  /** Optional renderer configuration for styling */
  rendererConfig?: any;
}

const SplineEntity: React.FC<SplineEntityProps> = ({ entity, isSelected, onClick, rendererConfig }) => {
  const { control_points, closed } = entity;
  
  // For simplicity, we'll approximate splines as polylines through control points
  // In a production app, you'd use a proper spline approximation algorithm
  const pointsString = control_points.map(point => `${point[0]},${point[1]}`).join(' ');
  
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
    // For closed splines
    return (
      <polygon
        points={pointsString}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        onClick={onClick}
        data-entity-type="SPLINE"
        data-entity-handle={entity.handle}
        data-layer={entity.layer}
        className="cursor-pointer transition-colors duration-150"
      />
    );
  }
  
  // For open splines
  return (
    <polyline
      points={pointsString}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill="none"
      onClick={onClick}
      data-entity-type="SPLINE"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="cursor-pointer transition-colors duration-150"
    />
  );
};

export default SplineEntity;