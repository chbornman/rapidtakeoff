import React from 'react';
import { Entity } from '../types';

interface GenericEntityProps {
  entity: Entity;
  isSelected: boolean;
  onClick: () => void;
}

const GenericEntity: React.FC<GenericEntityProps> = ({ entity, isSelected, onClick }) => {
  // This is a fallback component for unsupported entity types
  // Instead of rendering a square, we'll just return null
  // to avoid drawing unnecessary elements
  return null;
};

export default GenericEntity;