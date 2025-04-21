import React from 'react';
import { PolylineEntity as PolylineEntityType } from '../types';

interface PolylineEntityProps {
  entity: PolylineEntityType;
  isSelected: boolean;
  onClick: () => void;
}

const PolylineEntity: React.FC<PolylineEntityProps> = ({ entity, isSelected, onClick }) => {
  const { points, closed } = entity;
  
  // Format points for SVG polyline
  const pointsString = points.map(point => `${point[0]},${point[1]}`).join(' ');
  
  if (closed) {
    // For closed polylines, use polygon
    return (
      <polygon
        points={pointsString}
        stroke={isSelected ? '#FF0000' : '#FFFFFF'}
        strokeWidth={isSelected ? 3 : 2}
        fill="none"
        onClick={onClick}
        data-entity-type={entity.type}
        data-entity-handle={entity.handle}
        data-layer={entity.layer}
        className="hover:stroke-blue-400 cursor-pointer transition-colors duration-150"
      />
    );
  }
  
  // For open polylines
  return (
    <polyline
      points={pointsString}
      stroke={isSelected ? '#FF0000' : '#FFFFFF'}
      strokeWidth={isSelected ? 2 : 1}
      fill="none"
      onClick={onClick}
      data-entity-type={entity.type}
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="hover:stroke-blue-400 cursor-pointer transition-colors duration-150"
    />
  );
};

export default PolylineEntity;