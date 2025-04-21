import React from 'react';
import { Entity, SelectedFeature } from '../../types';
import DxfEntity from '../../entities/DxfEntity';

interface EntityRendererProps {
  entities: Entity[];
  selectedFeature: SelectedFeature | null;
  onFeatureSelect: (feature: SelectedFeature | null) => void;
  rendererConfig: any;
  dxfData: any;
}

/**
 * Component responsible for rendering all DXF entities
 */
const EntityRenderer: React.FC<EntityRendererProps> = ({
  entities,
  selectedFeature,
  onFeatureSelect,
  rendererConfig,
  dxfData
}) => {
  return (
    <>
      {entities.map(entity => (
        <DxfEntity
          key={entity.handle}
          entity={entity}
          isSelected={selectedFeature?.entity.handle === entity.handle}
          onClick={() => {
            // Find layer and index information for the selected entity
            let layerName = '';
            let entityIndex = -1;
            
            // Search through the original data to find the layer and index
            Object.entries(dxfData).forEach(([layer, layerEntities]) => {
              const idx = layerEntities.findIndex(e => e.handle === entity.handle);
              if (idx !== -1) {
                layerName = layer;
                entityIndex = idx;
              }
            });
            
            if (layerName) {
              onFeatureSelect({
                layerName,
                entityType: entity.type,
                entityIndex,
                entity
              });
            }
          }}
          rendererConfig={{
            ...rendererConfig,
            canvas: {
              ...rendererConfig.canvas,
              colors: {
                ...rendererConfig.canvas?.colors,
                default: '#ffffff',
                selection: '#ff9900',
                hover: '#ffcc00',
                background: '#2e2e2e'
              },
              entity: {
                ...rendererConfig.canvas?.entity,
                strokeWidth: {
                  default: 1,
                  selected: 1,
                  hover: 1
                }
              }
            },
            wireframe: true
          }}
        />
      ))}
    </>
  );
};

export default EntityRenderer;