import React from 'react';
import { HatchEntity as HatchEntityType } from '../types';

interface HatchEntityProps {
  entity: HatchEntityType;
  isSelected: boolean;
  onClick: () => void;
}

const HatchEntity: React.FC<HatchEntityProps> = ({ entity, isSelected, onClick }) => {
  // Hatch entities are complex - in a real implementation, we'd need to parse the boundary paths
  // For this example, we'll just show a placeholder rectangle
  
  // Check if we have a solid fill
  const { solid_fill } = entity;
  
  return (
    <rect
      x="0"
      y="0"
      width="10"
      height="10"
      stroke={isSelected ? '#FF0000' : '#FFFFFF'}
      strokeWidth={isSelected ? 2 : 1}
      fill={solid_fill ? (isSelected ? '#FF4444' : '#888888') : 'none'}
      fillOpacity={solid_fill ? 0.5 : 0}
      onClick={onClick}
      data-entity-type="HATCH"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="hover:stroke-blue-400 cursor-pointer transition-colors duration-150"
    />
  );
};

export default HatchEntity;