import React from 'react';
import { EllipseEntity as EllipseEntityType } from '../types';

interface EllipseEntityProps {
  entity: EllipseEntityType;
  isSelected: boolean;
  onClick: () => void;
}

const EllipseEntity: React.FC<EllipseEntityProps> = ({ entity, isSelected, onClick }) => {
  const { center, major_axis, ratio } = entity;
  
  // Calculate ellipse parameters
  const rx = Math.sqrt(major_axis[0]**2 + major_axis[1]**2);
  const ry = rx * ratio;
  
  // Calculate rotation angle in degrees
  const angle = Math.atan2(major_axis[1], major_axis[0]) * (180 / Math.PI);
  
  return (
    <ellipse
      cx={center[0]}
      cy={center[1]}
      rx={rx}
      ry={ry}
      transform={`rotate(${angle} ${center[0]} ${center[1]})`}
      stroke={isSelected ? '#FF0000' : '#FFFFFF'}
      strokeWidth={isSelected ? 2 : 1}
      fill="none"
      onClick={onClick}
      data-entity-type="ELLIPSE"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="hover:stroke-blue-400 cursor-pointer transition-colors duration-150"
    />
  );
};

export default EllipseEntity;