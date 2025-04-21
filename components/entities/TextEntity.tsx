import React from 'react';
import { TextEntity as TextEntityType } from '../types';

interface TextEntityProps {
  entity: TextEntityType;
  isSelected: boolean;
  onClick: () => void;
}

const TextEntity: React.FC<TextEntityProps> = ({ entity, isSelected, onClick }) => {
  const { text, insert, height, rotation } = entity;
  
  // Convert DXF height to SVG font size (approximate)
  const fontSize = height * 10; // Scale factor approximate
  
  return (
    <text
      x={insert[0]}
      y={insert[1]}
      fontSize={fontSize}
      fill={isSelected ? '#FF0000' : '#FFFFFF'}
      stroke="none"
      transform={rotation ? `rotate(${rotation} ${insert[0]} ${insert[1]})` : undefined}
      onClick={onClick}
      data-entity-type={entity.type}
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="hover:fill-blue-400 cursor-pointer transition-colors duration-150"
    >
      {text}
    </text>
  );
};

export default TextEntity;