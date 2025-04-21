import React from 'react';
import { CircleEntity as CircleEntityType } from '../types';

interface CircleEntityProps {
  entity: CircleEntityType;
  isSelected: boolean;
  onClick: () => void;
}

const CircleEntity: React.FC<CircleEntityProps> = ({ entity, isSelected, onClick }) => {
  const { center, radius } = entity;
  
  return (
    <circle
      cx={center[0]}
      cy={center[1]}
      r={radius}
      stroke={isSelected ? '#FF0000' : '#FFFFFF'}
      strokeWidth={isSelected ? 3 : 2}
      fill="none"
      onClick={onClick}
      data-entity-type="CIRCLE"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="hover:stroke-blue-400 cursor-pointer transition-colors duration-150"
    />
  );
};

export default CircleEntity;