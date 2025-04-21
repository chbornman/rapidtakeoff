import React from 'react';
import { ArcEntity as ArcEntityType } from '../types';

interface ArcEntityProps {
  entity: ArcEntityType;
  isSelected: boolean;
  onClick: () => void;
  /** Optional renderer configuration for styling */
  rendererConfig?: any;
}

const ArcEntity: React.FC<ArcEntityProps> = ({ entity, isSelected, onClick, rendererConfig }) => {
  const { center, radius, start_angle, end_angle } = entity;
  
  // Convert degrees to radians
  const startAngleRad = (start_angle * Math.PI) / 180;
  const endAngleRad = (end_angle * Math.PI) / 180;
  
  // Calculate start and end points
  const startX = center[0] + radius * Math.cos(startAngleRad);
  const startY = center[1] + radius * Math.sin(startAngleRad);
  const endX = center[0] + radius * Math.cos(endAngleRad);
  const endY = center[1] + radius * Math.sin(endAngleRad);
  
  // Determine if the arc is larger than 180 degrees
  const largeArcFlag = Math.abs(end_angle - start_angle) > 180 ? '1' : '0';
  
  // Determine sweep flag based on direction (clockwise vs counterclockwise)
  const sweepFlag = end_angle > start_angle ? '1' : '0';
  
  // Construct SVG path for arc
  const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
  
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
    <path
      d={pathData}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill={strokeColor}
      onClick={onClick}
      data-entity-type="ARC"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="cursor-pointer transition-colors duration-150"
    />
  );
};

export default ArcEntity;