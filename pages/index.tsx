import React, { useState, useEffect } from "react";
import type { SelectedFeature, DXFData, LayerVisibility } from "../components/types";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import Modal from "../components/Modal";
import DxfCanvas from "../components/DxfCanvas";
import ResizablePanel from "../components/ResizablePanel";
import DebugPanel from "../components/DebugPanel";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  sizes,
} from "../styles/theme";


// Extend Window interface with electron API
declare global {
  interface Window {
    electron: {
      openFileDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      parseDXFTree: (filePath: string) => Promise<string>;
      getRendererConfig: () => Promise<any>;
    };
  }
}

export default function Home() {
  const [showAccount, setShowAccount] = useState(false);
  const [dxfFilePath, setDxfFilePath] = useState<string | null>(null);
  const [dxfData, setDxfData] = useState<DXFData | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({});
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [rendererConfig, setRendererConfig] = useState<any>({});
  
  // Load component-based renderer config from JSON file
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await window.electron.getRendererConfig();
        if (config) {
          setRendererConfig(config);
          setConfigError(null);
        } else {
          setConfigError("Invalid configuration format");
        }
      } catch (error) {
        console.error('Error loading component renderer config:', error);
        setConfigError(`Configuration error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    loadConfig();
  }, []);

  // Log the selected feature for debugging
  useEffect(() => {
    console.log("Selected feature:", selectedFeature);
  }, [selectedFeature]);

  // Handle selecting a new DXF file: parse the DXF data
  const handleFileSelect = async (filePath: string) => {
    setDxfFilePath(filePath);
    
    try {
      // Parse DXF tree data
      const result = await window.electron.parseDXFTree(filePath);
      const data = JSON.parse(result) as DXFData;
      setDxfData(data);
      
      // Initialize layer visibility (all layers visible by default)
      const initialVisibility = Object.keys(data).reduce<LayerVisibility>((acc, layerName) => {
        acc[layerName] = true;
        return acc;
      }, {});
      setLayerVisibility(initialVisibility);
      
      // Reset selected feature
      setSelectedFeature(null);
    } catch (err) {
      console.error("Failed to parse DXF:", err);
      setDxfData(null);
    }
  };

  // Handle layer visibility changes
  const handleLayerVisibilityChange = (visibility: LayerVisibility) => {
    setLayerVisibility(visibility);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <ResizablePanel
        defaultWidth={sizes.sidebar.width}
        minWidth="180px"
        maxWidth="400px"
        position="left"
      >
        <LeftSidebar
          onAccount={() => setShowAccount(true)}
          onFileSelect={handleFileSelect}
          filePath={dxfFilePath}
          onFeatureSelect={setSelectedFeature}
        />
      </ResizablePanel>
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: colors.surface.main }}
      >
        {configError ? (
          <div className="text-red-500 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="font-bold mb-2">Configuration Error</h3>
            <p>{configError}</p>
            <p className="mt-2 text-sm">Please ensure the component_renderer_config.json file exists and is valid.</p>
          </div>
        ) : (
          <DxfCanvas
            dxfData={dxfData}
            layerVisibility={layerVisibility}
            selectedFeature={selectedFeature}
            onFeatureSelect={setSelectedFeature}
            rendererConfig={rendererConfig}
          />
        )}
      </div>
      <ResizablePanel
        defaultWidth={sizes.sidebar.width}
        minWidth="180px"
        maxWidth="400px"
        position="right"
      >
        <RightSidebar 
          dxfData={dxfData}
          onLayerVisibilityChange={handleLayerVisibilityChange}
        />
      </ResizablePanel>

      {/* Debug Panel for console logs */}
      <DebugPanel maxLogs={50} />

      {showAccount && (
        <Modal onClose={() => setShowAccount(false)}>
          <h2 className="text-2xl font-bold mb-4">Account</h2>
          <p className="text-gray-700">User account details go here.</p>
        </Modal>
      )}
    </div>
  );
}