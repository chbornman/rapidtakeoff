import React from 'react';
import { DXFData, LayerVisibility, SelectedFeature, RenderingMode } from './types';
import CanvasCore from './canvas/CanvasCore';

interface CanvasProps {
  dxfData: DXFData | null;
  layerVisibility: LayerVisibility;
  selectedFeature: SelectedFeature | null;
  onFeatureSelect: (feature: SelectedFeature | null) => void;
  rendererConfig?: any;
}

/**
 * Canvas component for rendering DXF files
 * This is a wrapper component that delegates to CanvasCore
 */
const Canvas: React.FC<CanvasProps> = (props) => {
  return (
    <div className="relative w-full h-full">
      <CanvasCore {...props} />
      
      {props.dxfData && (
        <div className="absolute top-4 left-4 bg-gray-800 rounded-lg shadow-lg p-2 text-white">
          <div className="flex items-center space-x-1 text-sm">
            <span>Renderer:</span>
            <button 
              className={`px-2 py-1 rounded-l-lg ${props.rendererConfig?.renderingMode === 'component' ? 'bg-blue-600' : 'bg-gray-700'}`}
              onClick={() => {
                // Only trigger the change if we're not already in this mode
                if (props.rendererConfig?.renderingMode !== 'component') {
                  // Dispatch a custom event to change rendering mode
                  // This is necessary because we don't have direct access to setRenderingMode
                  const event = new CustomEvent('changeRenderingMode', { 
                    detail: { mode: 'component', forceRefresh: true } 
                  });
                  window.dispatchEvent(event);
                }
              }}
            >
              Component
            </button>
            <button 
              className={`px-2 py-1 rounded-r-lg ${props.rendererConfig?.renderingMode === 'ezdxf' ? 'bg-blue-600' : 'bg-gray-700'}`}
              onClick={() => {
                // Only trigger the change if we're not already in this mode
                if (props.rendererConfig?.renderingMode !== 'ezdxf') {
                  const event = new CustomEvent('changeRenderingMode', { 
                    detail: { mode: 'ezdxf', forceRefresh: true } 
                  });
                  window.dispatchEvent(event);
                }
              }}
            >
              ezdxf
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;