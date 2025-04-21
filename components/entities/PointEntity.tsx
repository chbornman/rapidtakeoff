import React from 'react';
import { PointEntity as PointEntityType } from '../types';

interface PointEntityProps {
  entity: PointEntityType;
  isSelected: boolean;
  onClick: () => void;
}

const PointEntity: React.FC<PointEntityProps> = ({ entity, isSelected, onClick }) => {
  const { location } = entity;
  const pointSize = isSelected ? 6 : 4;
  
  return (
    <circle
      cx={location[0]}
      cy={location[1]}
      r={pointSize}
      stroke={isSelected ? '#FF0000' : '#FFFFFF'}
      fill={isSelected ? '#FF0000' : '#FFFFFF'}
      onClick={onClick}
      data-entity-type="POINT"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="hover:stroke-blue-400 hover:fill-blue-400 cursor-pointer transition-colors duration-150"
    />
  );
};

export default PointEntity;