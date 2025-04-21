import React from 'react';
import { CircleEntity as CircleEntityType } from '../types';

interface CircleEntityProps {
  entity: CircleEntityType;
  isSelected: boolean;
  onClick: () => void;
  /** Optional renderer configuration for styling */
  rendererConfig?: any;
}

const CircleEntity: React.FC<CircleEntityProps> = ({ entity, isSelected, onClick, rendererConfig }) => {
  const { center, radius } = entity;
  
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
    <circle
      cx={center[0]}
      cy={center[1]}
      r={radius}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill="none"
      onClick={onClick}
      data-entity-type="CIRCLE"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="cursor-pointer transition-colors duration-150"
    />
  );
};

export default CircleEntity;