import React from 'react';
import { LineEntity as LineEntityType } from '../types';

interface LineEntityProps {
  entity: LineEntityType;
  isSelected: boolean;
  onClick: () => void;
}

const LineEntity: React.FC<LineEntityProps> = ({ entity, isSelected, onClick }) => {
  // Extract line coordinates
  const { start, end } = entity;
  
  return (
    <line
      x1={start[0]}
      y1={start[1]}
      x2={end[0]}
      y2={end[1]}
      stroke={isSelected ? '#FF0000' : '#FFFFFF'}
      strokeWidth={isSelected ? 3 : 2}
      onClick={onClick}
      data-entity-type="LINE"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="hover:stroke-blue-400 cursor-pointer transition-colors duration-150"
    />
  );
};

export default LineEntity;