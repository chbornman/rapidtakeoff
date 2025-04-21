import React from 'react';
import { Entity, SelectedFeature } from '../types';
import LineEntity from './LineEntity';
import CircleEntity from './CircleEntity';
import ArcEntity from './ArcEntity';
import PointEntity from './PointEntity';
import PolylineEntity from './PolylineEntity';
import TextEntity from './TextEntity';
import SplineEntity from './SplineEntity';
import EllipseEntity from './EllipseEntity';
import HatchEntity from './HatchEntity';
import GenericEntity from './GenericEntity';

interface DxfEntityProps {
  entity: Entity;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Component factory that renders the appropriate entity component based on type
 */
const DxfEntity: React.FC<DxfEntityProps> = ({ entity, isSelected, onClick }) => {
  const entityType = entity.type.toUpperCase();

  // Render the appropriate component based on entity type
  switch (entityType) {
    case 'LINE':
      return <LineEntity entity={entity} isSelected={isSelected} onClick={onClick} />;
    
    case 'CIRCLE':
      return <CircleEntity entity={entity} isSelected={isSelected} onClick={onClick} />;
    
    case 'ARC':
      return <ArcEntity entity={entity} isSelected={isSelected} onClick={onClick} />;
    
    case 'POINT':
      return <PointEntity entity={entity} isSelected={isSelected} onClick={onClick} />;
    
    case 'LWPOLYLINE':
    case 'POLYLINE':
      return <PolylineEntity entity={entity} isSelected={isSelected} onClick={onClick} />;
    
    case 'TEXT':
    case 'MTEXT':
      return <TextEntity entity={entity} isSelected={isSelected} onClick={onClick} />;
    
    case 'SPLINE':
      return <SplineEntity entity={entity} isSelected={isSelected} onClick={onClick} />;
    
    case 'ELLIPSE':
      return <EllipseEntity entity={entity} isSelected={isSelected} onClick={onClick} />;
    
    case 'HATCH':
      return <HatchEntity entity={entity} isSelected={isSelected} onClick={onClick} />;
    
    // For all other entity types, use a generic representation
    default:
      return <GenericEntity entity={entity} isSelected={isSelected} onClick={onClick} />;
  }
};

export default DxfEntity;