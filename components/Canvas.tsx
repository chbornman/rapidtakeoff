import React from 'react';
import { DXFData, LayerVisibility, SelectedFeature } from './types';
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
  return <CanvasCore {...props} />;
};

export default Canvas;