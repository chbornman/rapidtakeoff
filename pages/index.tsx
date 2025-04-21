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
      onConfigFileChanged: (callback: () => void) => () => void;
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
          console.log('[REACT] Loaded renderer config');
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
    
    // Load config initially
    loadConfig();
    
    // Set up listener for config file changes
    const removeListener = window.electron.onConfigFileChanged(() => {
      console.log('[REACT] Detected config file change, reloading config');
      loadConfig();
    });
    
    // Clean up listener when component unmounts
    return () => {
      removeListener();
    };
  }, []);

  // Log the selected feature for debugging
  useEffect(() => {
    console.log("Selected feature:", selectedFeature);
  }, [selectedFeature]);

  // State to track file loading status to prevent duplicate processing
  const [isLoading, setIsLoading] = useState(false);

  // Function to parse DXF data with the current config
  const parseDXFWithConfig = useCallback(async (filePath: string, config: any) => {
    console.log('[REACT] Sending file to be parsed with config');
    const result = await window.electron.parseDXFTree(filePath, config);
    console.log(`[REACT] Received parsed DXF data (${result.length} bytes)`);
    
    console.time('[REACT] JSON parsing');
    const data = JSON.parse(result) as DXFData;
    console.timeEnd('[REACT] JSON parsing');
    
    console.log(`[REACT] DXF data parsed with ${Object.keys(data).length} layers`);
    const entityCount = Object.values(data).reduce((sum, entities) => sum + entities.length, 0);
    console.log(`[REACT] Total entity count: ${entityCount}`);
    
    return data;
  }, []);

  // Use a ref to track the previous config to avoid unnecessary reloads
  const prevConfigRef = React.useRef<string>("");
  
  // Effect to reload the current DXF file when the config changes
  useEffect(() => {
    // Stringify config for comparison
    const configStr = JSON.stringify(rendererConfig);
    
    // Only reload if we have a file already loaded and the config actually changed
    if (dxfFilePath && 
        rendererConfig && 
        Object.keys(rendererConfig).length > 0 && 
        configStr !== prevConfigRef.current) {
      
      console.log('[REACT] Config changed, reloading current DXF file');
      prevConfigRef.current = configStr;
      
      // Don't reload if we're already loading another file
      if (isLoading) return;
      
      // Set loading state to prevent duplicate processing
      setIsLoading(true);
      
      // Re-parse the DXF with the new config
      parseDXFWithConfig(dxfFilePath, rendererConfig)
        .then(data => {
          setDxfData(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('[REACT] Failed to reload DXF with new config:', err);
          setIsLoading(false);
        });
    } else if (configStr !== prevConfigRef.current) {
      // Just update the ref if we don't need to reload
      prevConfigRef.current = configStr;
    }
  }, [rendererConfig, dxfFilePath, isLoading, parseDXFWithConfig]);

  // Handle selecting a new DXF file: parse the DXF data
  const handleFileSelect = async (filePath: string) => {
    console.log(`[REACT] Selected DXF file: ${filePath}`);
    
    // Prevent duplicate processing
    if (isLoading) {
      console.log('[REACT] Already processing a file, ignoring duplicate request');
      return;
    }
    
    setIsLoading(true);
    setDxfFilePath(filePath);
    
    try {
      // Make sure we have the renderer config first
      let config = rendererConfig;
      if (!config || Object.keys(config).length === 0) {
        try {
          console.log('[REACT] No renderer config loaded yet, getting from main process');
          config = await window.electron.getRendererConfig();
          console.log('[REACT] Received renderer config from main process', config);
          setRendererConfig(config);
        } catch (configErr) {
          console.warn("[REACT] Could not load renderer config:", configErr);
          config = {}; // Use empty config if we can't load it
        }
      }
      
      // Parse DXF tree data with renderer config
      const data = await parseDXFWithConfig(filePath, config);
      setDxfData(data);
      
      // File processing complete
      setIsLoading(false);
      
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
      // Reset loading state on error
      console.error("Failed to parse DXF:", err);
      setDxfData(null);
      setIsLoading(false);
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
        defaultWidth="300px"
        minWidth="180px"
        maxWidth="600px"
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
            rendererConfig={rendererConfig}
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