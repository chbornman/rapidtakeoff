import React from 'react';
import { SplineEntity as SplineEntityType } from '../types';

interface SplineEntityProps {
  entity: SplineEntityType;
  isSelected: boolean;
  onClick: () => void;
}

const SplineEntity: React.FC<SplineEntityProps> = ({ entity, isSelected, onClick }) => {
  const { control_points, closed } = entity;
  
  // For simplicity, we'll approximate splines as polylines through control points
  // In a production app, you'd use a proper spline approximation algorithm
  const pointsString = control_points.map(point => `${point[0]},${point[1]}`).join(' ');
  
  if (closed) {
    // For closed splines
    return (
      <polygon
        points={pointsString}
        stroke={isSelected ? '#FF0000' : '#FFFFFF'}
        strokeWidth={isSelected ? 3 : 2}
        fill="none"
        onClick={onClick}
        data-entity-type="SPLINE"
        data-entity-handle={entity.handle}
        data-layer={entity.layer}
        className="hover:stroke-blue-400 cursor-pointer transition-colors duration-150"
      />
    );
  }
  
  // For open splines
  return (
    <polyline
      points={pointsString}
      stroke={isSelected ? '#FF0000' : '#FFFFFF'}
      strokeWidth={isSelected ? 2 : 1}
      fill="none"
      onClick={onClick}
      data-entity-type="SPLINE"
      data-entity-handle={entity.handle}
      data-layer={entity.layer}
      className="hover:stroke-blue-400 cursor-pointer transition-colors duration-150"
    />
  );
};

export default SplineEntity;