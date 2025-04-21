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
  /** Renderer config for styling entities */
  rendererConfig?: any;
}

/**
 * Component factory that renders the appropriate entity component based on type
 */
const DxfEntity: React.FC<DxfEntityProps> = ({ entity, isSelected, onClick, rendererConfig }) => {
  const entityType = entity.type.toUpperCase();

  // Handle the click event with stopPropagation to prevent canvas drag interference
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the event from bubbling up to the canvas
    onClick();
  };

  // Render the appropriate component based on entity type
  switch (entityType) {
    case 'LINE':
      return <LineEntity entity={entity} isSelected={isSelected} onClick={handleClick} rendererConfig={rendererConfig} />;
    
    case 'CIRCLE':
      return <CircleEntity entity={entity} isSelected={isSelected} onClick={handleClick} rendererConfig={rendererConfig} />;
    
    case 'ARC':
      return <ArcEntity entity={entity} isSelected={isSelected} onClick={handleClick} rendererConfig={rendererConfig} />;
    
    case 'POINT':
      return <PointEntity entity={entity} isSelected={isSelected} onClick={handleClick} rendererConfig={rendererConfig} />;
    
    case 'LWPOLYLINE':
    case 'POLYLINE':
      return <PolylineEntity entity={entity} isSelected={isSelected} onClick={handleClick} rendererConfig={rendererConfig} />;
    
    case 'TEXT':
    case 'MTEXT':
      return <TextEntity entity={entity} isSelected={isSelected} onClick={handleClick} rendererConfig={rendererConfig} />;
    
    case 'SPLINE':
      return <SplineEntity entity={entity} isSelected={isSelected} onClick={handleClick} rendererConfig={rendererConfig} />;
    
    case 'ELLIPSE':
      return <EllipseEntity entity={entity} isSelected={isSelected} onClick={handleClick} rendererConfig={rendererConfig} />;
    
    case 'HATCH':
      return <HatchEntity entity={entity} isSelected={isSelected} onClick={handleClick} rendererConfig={rendererConfig} />;
    
    // For all other entity types, use a generic representation
    default:
      return <GenericEntity entity={entity} isSelected={isSelected} onClick={handleClick} rendererConfig={rendererConfig} />;
  }
};

export default DxfEntity;