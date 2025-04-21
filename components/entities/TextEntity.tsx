import React from 'react';
import { TextEntity as TextEntityType } from '../types';

interface TextEntityProps {
  entity: TextEntityType;
  isSelected: boolean;
  onClick: () => void;
  /** Optional renderer configuration for styling */
  rendererConfig?: any;
}

const TextEntity: React.FC<TextEntityProps> = ({ entity, isSelected, onClick, rendererConfig }) => {
  const { text, insert, height, rotation } = entity;
  
  // Convert DXF height to SVG font size (approximate)
  // Determine styling from rendererConfig
  const canvasEntityCfg = rendererConfig?.canvas?.entity;
  const textScaleFactor = canvasEntityCfg?.textSize?.scaleFactor ?? 10;
  const fontSize = height * textScaleFactor;
  const typeKey = entity.type.toLowerCase();
  const entityColor = rendererConfig?.entities?.[typeKey]?.color || rendererConfig?.canvas?.colors?.default || '#FFFFFF';
  const selectionColor = rendererConfig?.canvas?.colors?.selection || '#FF0000';
  const fillColor = isSelected ? selectionColor : entityColor;
  
  return (
    <text
      x={insert[0]}
      y={insert[1]}
      fontSize={fontSize}
      fill={fillColor}
      stroke="none"
      transform={rotation ? `rotate(${rotation} ${insert[0]} ${insert[1]})` : undefined}
      onClick={onClick}
      data-entity-type={entity.type}
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="cursor-pointer transition-colors duration-150"
    >
      {text}
    </text>
  );
};

export default TextEntity;