import React from 'react';
import { EllipseEntity as EllipseEntityType } from '../types';

interface EllipseEntityProps {
  entity: EllipseEntityType;
  isSelected: boolean;
  onClick: () => void;
  /** Optional renderer configuration for styling */
  rendererConfig?: any;
}

const EllipseEntity: React.FC<EllipseEntityProps> = ({ entity, isSelected, onClick, rendererConfig }) => {
  const { center, major_axis, ratio } = entity;
  
  // Calculate ellipse parameters
  const rx = Math.sqrt(major_axis[0]**2 + major_axis[1]**2);
  const ry = rx * ratio;
  
  // Calculate rotation angle in degrees
  const angle = Math.atan2(major_axis[1], major_axis[0]) * (180 / Math.PI);
  
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

  return (
    <ellipse
      cx={center[0]}
      cy={center[1]}
      rx={rx}
      ry={ry}
      transform={`rotate(${angle} ${center[0]} ${center[1]})`}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill={strokeColor}
      onClick={onClick}
      data-entity-type="ELLIPSE"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="cursor-pointer transition-colors duration-150"
    />
  );
};

export default EllipseEntity;