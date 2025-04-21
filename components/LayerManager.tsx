import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ChevronDownIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { LayerVisibility, DXFData } from './types';

interface LayerManagerProps {
  dxfData: DXFData | null;
  onLayerVisibilityChange: (visibility: LayerVisibility) => void;
}

const LayerManager: React.FC<LayerManagerProps> = ({ 
  dxfData, 
  onLayerVisibilityChange 
}) => {
  const [expanded, setExpanded] = useState(true);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({});
  const [layers, setLayers] = useState<string[]>([]);
  const isInitializedRef = useRef(false);
  
  // Update layers list when dxfData changes
  useEffect(() => {
    // Skip if no data
    if (!dxfData) {
      setLayers([]);
      return;
    }
    
    // Extract layer names
    const layerNames = Object.keys(dxfData);
    setLayers(layerNames);
    
    // Initialize all layers to visible
    if (!isInitializedRef.current) {
      const initialVisibility: LayerVisibility = {};
      layerNames.forEach(name => {
        initialVisibility[name] = true;
      });
      
      // Set local state first
      setLayerVisibility(initialVisibility);
      
      // Then notify parent - but only once
      setTimeout(() => {
        onLayerVisibilityChange(initialVisibility);
        isInitializedRef.current = true;
      }, 0);
    }
  // Intentionally omit dependencies to prevent re-initialization
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dxfData]);
  
  // Memoize toggle functions to prevent unnecessary rerenders
  const toggleLayerVisibility = useCallback((layerName: string) => {
    setLayerVisibility(prev => {
      const updated = {
        ...prev,
        [layerName]: !prev[layerName]
      };
      
      // Only notify parent if we're initialized
      if (isInitializedRef.current) {
        onLayerVisibilityChange(updated);
      }
      
      return updated;
    });
  }, [onLayerVisibilityChange]);
  
  const toggleAllLayers = useCallback((visible: boolean) => {
    setLayerVisibility(prev => {
      const updated = {...prev};
      layers.forEach(layer => {
        updated[layer] = visible;
      });
      
      // Only notify parent if we're initialized
      if (isInitializedRef.current) {
        onLayerVisibilityChange(updated);
      }
      
      return updated;
    });
  }, [layers, onLayerVisibilityChange]);
  
  // Count entities in a layer
  const countEntities = useCallback((layerName: string): number => {
    return dxfData && dxfData[layerName] ? dxfData[layerName].length : 0;
  }, [dxfData]);
  
  // Show placeholder if no data
  if (!dxfData || layers.length === 0) {
    return (
      <div className="p-2 text-gray-400 text-xs">
        No layers available
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-auto text-sm">
      <div 
        className="flex items-center justify-between p-2 bg-gray-800 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          {expanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
          <span className="ml-1 font-medium">Layers</span>
        </div>
        <div className="flex space-x-1">
          <button 
            className="p-1 rounded hover:bg-gray-700 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              toggleAllLayers(true);
            }}
            title="Show All Layers"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button 
            className="p-1 rounded hover:bg-gray-700 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              toggleAllLayers(false);
            }}
            title="Hide All Layers"
          >
            <EyeSlashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-1 space-y-1">
          {layers.map(layerName => (
            <div 
              key={layerName} 
              className="flex items-center justify-between p-1 rounded hover:bg-gray-700"
            >
              <div className="flex items-center overflow-hidden">
                <button
                  className="p-1 rounded hover:bg-gray-600"
                  onClick={() => toggleLayerVisibility(layerName)}
                  title={layerVisibility[layerName] ? "Hide Layer" : "Show Layer"}
                >
                  {layerVisibility[layerName] ? (
                    <EyeIcon className="w-4 h-4 text-green-400" />
                  ) : (
                    <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                <span className="ml-2 truncate" title={layerName}>
                  {layerName}
                </span>
              </div>
              <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded-full">
                {countEntities(layerName)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(LayerManager);