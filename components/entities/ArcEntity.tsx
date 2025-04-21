import React from 'react';
import { ArcEntity as ArcEntityType } from '../types';

interface ArcEntityProps {
  entity: ArcEntityType;
  isSelected: boolean;
  onClick: () => void;
}

const ArcEntity: React.FC<ArcEntityProps> = ({ entity, isSelected, onClick }) => {
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
  
  return (
    <path
      d={pathData}
      stroke={isSelected ? '#FF0000' : '#FFFFFF'}
      strokeWidth={isSelected ? 3 : 2}
      fill="none"
      onClick={onClick}
      data-entity-type="ARC"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="hover:stroke-blue-400 cursor-pointer transition-colors duration-150"
    />
  );
};

export default ArcEntity;