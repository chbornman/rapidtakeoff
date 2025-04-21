import React from 'react';
import { LineEntity as LineEntityType } from '../types';

interface LineEntityProps {
  entity: LineEntityType;
  isSelected: boolean;
  onClick: () => void;
  /** Optional renderer configuration for styling */
  rendererConfig?: any;
}

const LineEntity: React.FC<LineEntityProps> = ({ entity, isSelected, onClick, rendererConfig }) => {
  // Extract line coordinates
  const { start, end } = entity;
  
  // Determine styling from rendererConfig
  const typeKey = entity.type.toLowerCase();
  const entitiesConfig = rendererConfig?.entities || {};
  const entityConfig = entitiesConfig[typeKey] || {};
  const canvasEntityCfg = rendererConfig?.canvas?.entity;
  const defaultStrokeWidth = canvasEntityCfg?.strokeWidth?.default ?? 1;
  const selectedStrokeWidth = canvasEntityCfg?.strokeWidth?.selected ?? defaultStrokeWidth + 1;
  
  // Use entity color if defined, fallback to config, then white for dark background
  const defaultColor = entityConfig.color || rendererConfig?.canvas?.colors?.default || '#FFFFFF';
  const entityColor = entity.rgb || defaultColor;
  const selectionColor = rendererConfig?.canvas?.colors?.selection || '#FF9900';
  const strokeColor = isSelected ? selectionColor : entityColor;
  const strokeWidth = isSelected ? selectedStrokeWidth : defaultStrokeWidth;

  return (
    <line
      x1={start[0]}
      y1={start[1]}
      x2={end[0]}
      y2={end[1]}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      onClick={onClick}
      data-entity-type="LINE"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="cursor-pointer transition-colors duration-150"
    />
  );
};

export default LineEntity;