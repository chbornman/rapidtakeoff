import React, { useState, useEffect } from 'react';
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
  const [allLayers, setAllLayers] = useState<string[]>([]);

  // Initialize layer visibility when dxfData changes
  useEffect(() => {
    if (!dxfData) {
      setLayerVisibility({});
      setAllLayers([]);
      return;
    }

    const layers = Object.keys(dxfData);
    setAllLayers(layers);

    // Initialize all layers as visible
    const initialVisibility = layers.reduce<LayerVisibility>((acc, layer) => {
      acc[layer] = true;
      return acc;
    }, {});

    setLayerVisibility(initialVisibility);
    // Notify parent component of initial visibility
    onLayerVisibilityChange(initialVisibility);
  }, [dxfData, onLayerVisibilityChange]);

  // Toggle a single layer's visibility
  const toggleLayerVisibility = (layerName: string) => {
    const newVisibility = {
      ...layerVisibility,
      [layerName]: !layerVisibility[layerName]
    };
    setLayerVisibility(newVisibility);
    onLayerVisibilityChange(newVisibility);
  };

  // Toggle all layers' visibility
  const toggleAllLayers = (visible: boolean) => {
    const newVisibility = allLayers.reduce<LayerVisibility>((acc, layer) => {
      acc[layer] = visible;
      return acc;
    }, {});
    setLayerVisibility(newVisibility);
    onLayerVisibilityChange(newVisibility);
  };

  // Count entities in a layer
  const countEntities = (layerName: string): number => {
    return dxfData && dxfData[layerName] ? dxfData[layerName].length : 0;
  };

  if (!dxfData || allLayers.length === 0) {
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
          {allLayers.map(layerName => (
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

export default LayerManager;