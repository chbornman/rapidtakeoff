import React from 'react';
import { HatchEntity as HatchEntityType } from '../types';

interface HatchEntityProps {
  entity: HatchEntityType;
  isSelected: boolean;
  onClick: () => void;
  /** Optional renderer configuration for styling */
  rendererConfig?: any;
}

const HatchEntity: React.FC<HatchEntityProps> = ({ entity, isSelected, onClick, rendererConfig }) => {
  // Hatch entities are complex - in a real implementation, we'd need to parse the boundary paths
  // For this example, we'll just show a placeholder rectangle
  
  // Check if we have a solid fill
  const { solid_fill } = entity;
  
  // Determine styling from rendererConfig
  const typeKey = entity.type.toLowerCase();
  const entitiesConfig = rendererConfig?.entities || {};
  const entityConfig = entitiesConfig[typeKey] || {};
  const canvasEntityCfg = rendererConfig?.canvas?.entity;
  const defaultStrokeWidth = canvasEntityCfg?.strokeWidth?.default ?? 1;
  const selectedStrokeWidth = canvasEntityCfg?.strokeWidth?.selected ?? defaultStrokeWidth + 1;
  const defaultColor = entityConfig.outlineColor || entityConfig.color || rendererConfig?.canvas?.colors?.default || '#FFFFFF';
  const selectionColor = rendererConfig?.canvas?.colors?.selection || '#FF0000';
  const strokeColor = isSelected ? selectionColor : defaultColor;
  const strokeWidth = isSelected ? selectedStrokeWidth : defaultStrokeWidth;
  // Always use none for fill to ensure wireframe appearance
  const fillColor = 'none';
  const fillOpacity = 0;

  return (
    <rect
      x="0"
      y="0"
      width="10"
      height="10"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill={fillColor}
      fillOpacity={fillOpacity}
      onClick={onClick}
      data-entity-type="HATCH"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="cursor-pointer transition-colors duration-150"
    />
  );
};

export default HatchEntity;