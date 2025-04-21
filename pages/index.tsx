import React, { useState, useEffect, useCallback } from "react";
import type { SelectedFeature, DXFData, LayerVisibility } from "../components/types";
import LeftSidebar from "../components/LeftSidebar";
// import RightSidebar from "../components/RightSidebar"; // Removed right sidebar
import Modal from "../components/Modal";
import Canvas from "../components/Canvas";
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
      parseDXFTree: (filePath: string, config?: any) => Promise<string>;
      getRendererConfig: () => Promise<any>;
    };
  }
}

export default function Home() {
  const [showAccount, setShowAccount] = useState(false);
  const [dxfFilePath, setDxfFilePath] = useState<string | null>(null);
  const [dxfData, setDxfData] = useState<DXFData | null>(null);
  // Track visibility of layers, including special Origin & Axes layer
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({ 'Origin & Axes': true });
  // Track visibility of individual components per layer
  const [componentVisibility, setComponentVisibility] = useState<Record<string, Record<string, boolean>>>({});
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
      // Make sure we have the renderer config first
      let config = rendererConfig;
      if (!config) {
        try {
          config = await window.electron.getRendererConfig();
          setRendererConfig(config);
        } catch (configErr) {
          console.warn("Could not load renderer config:", configErr);
          config = {}; // Use empty config if we can't load it
        }
      }
      
      // Parse DXF tree data with renderer config
      const result = await window.electron.parseDXFTree(filePath, config);
      const data = JSON.parse(result) as DXFData;
      setDxfData(data);
      
      // Initialize layer visibility (all layers + Origin & Axes visible by default)
      const initialVisibility: LayerVisibility = { 'Origin & Axes': true };
      Object.keys(data).forEach(layerName => {
        initialVisibility[layerName] = true;
      });
      setLayerVisibility(initialVisibility);
      
      // Initialize component visibility using entity handles as unique IDs
      const initialCompVis: Record<string, Record<string, boolean>> = {};
      Object.entries(data).forEach(([layerName, entities]) => {
        initialCompVis[layerName] = {};
        entities.forEach((entity) => {
          // Use entity.handle as the unique identifier if available
          const id = entity.handle || `${layerName}:${entity.type}:${Math.random().toString(36).substr(2, 9)}`;
          initialCompVis[layerName][id] = true;
        });
      });
      setComponentVisibility(initialCompVis);
      
      // Reset selected feature
      setSelectedFeature(null);
      
      console.log(`Loaded DXF with ${Object.keys(data).length} layers and ${
        Object.values(data).reduce((count, entities) => count + entities.length, 0)
      } entities`);
    } catch (err) {
      console.error("Failed to parse DXF:", err);
      setDxfData(null);
    }
  };

  // Handle file close (reset everything)
  const handleFileClose = useCallback(() => {
    setDxfFilePath(null);
    setDxfData(null);
    setLayerVisibility({ 'Origin & Axes': true });
    setComponentVisibility({});
    setSelectedFeature(null);
  }, []);
  
  // Handle layer visibility changes
  const handleLayerVisibilityChange = useCallback((visibility: LayerVisibility) => {
    setLayerVisibility(visibility);
  }, []);
  // Handle component visibility changes
  const handleComponentVisibilityChange = useCallback((visibility: Record<string, Record<string, boolean>>) => {
    setComponentVisibility(visibility);
  }, []);

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
          onLayerVisibilityChange={handleLayerVisibilityChange}
          onComponentVisibilityChange={handleComponentVisibilityChange}
          onFileClose={handleFileClose}
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
          <Canvas
            dxfData={dxfData}
            layerVisibility={layerVisibility}
            componentVisibility={componentVisibility}
            selectedFeature={selectedFeature}
            onFeatureSelect={setSelectedFeature}
            rendererConfig={{
              ...rendererConfig,
              initialScaleFactor: 10, // Increase scale factor for better visibility
              showGrid: true,         // Show coordinate grid
              xAxisColor: '#ff5555',  // Bright red X axis
              yAxisColor: '#55ff55',  // Bright green Y axis
              backgroundColor: '#222222' // Darker background for better contrast
            }}
          />
        )}
      </div>
      {/* Right sidebar removed; layer controls integrated into component tree */}

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