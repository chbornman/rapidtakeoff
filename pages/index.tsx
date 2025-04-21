import React, { useState, useEffect, useCallback } from "react";
import type { SelectedFeature, DXFData, LayerVisibility, RenderingMode } from "../components/types";
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
  const ORIGIN_AXES_LAYER = 'Origin & Axes';
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({ [ORIGIN_AXES_LAYER]: true });
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [rendererConfig, setRendererConfig] = useState<any>({});
  const [renderingMode, setRenderingMode] = useState<RenderingMode>('component');
  
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
  // Conversion factor: drawing units to linear feet
  const [conversionFactor, setConversionFactor] = useState<number>(1);

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
  
  // Add an event listener for rendering mode changes
  useEffect(() => {
    const handleRenderingModeChange = (event: any) => {
      if (event.detail && event.detail.mode) {
        // Set the new rendering mode
        setRenderingMode(event.detail.mode);
        
        // Update the body attribute for CSS targeting
        document.body.setAttribute('data-rendering-mode', event.detail.mode);
        
        // Force refresh if requested and we have a file loaded
        if (event.detail.forceRefresh && dxfFilePath && !isLoading) {
          console.log(`[REACT] Forcing refresh for renderer change to ${event.detail.mode}`);
          
          // Clone the current config with the new rendering mode
          const refreshConfig = {
            ...rendererConfig,
            renderingMode: event.detail.mode,
            _timestamp: Date.now() // Add timestamp to force cache miss
          };
          
          // Trigger a re-render with the current file
          setIsLoading(true);
          parseDXFWithConfig(dxfFilePath, refreshConfig)
            .then(data => {
              setDxfData(data);
              setIsLoading(false);
            })
            .catch(err => {
              console.error('[REACT] Failed to refresh with new renderer:', err);
              setIsLoading(false);
            });
        }
      }
    };
    
    // Set initial body attribute
    document.body.setAttribute('data-rendering-mode', renderingMode);
    
    window.addEventListener('changeRenderingMode', handleRenderingModeChange);
    
    return () => {
      window.removeEventListener('changeRenderingMode', handleRenderingModeChange);
    };
  }, [dxfFilePath, isLoading, parseDXFWithConfig, rendererConfig]);
  
  // Effect to reload the current DXF file when the config changes or rendering mode changes
  useEffect(() => {
    // Create a merged config with the rendering mode
    const mergedConfig = {
      ...rendererConfig,
      renderingMode: renderingMode
    };
    
    // Stringify config for comparison
    const configStr = JSON.stringify(mergedConfig);
    
    // Only reload if we have a file already loaded and the config actually changed
    if (dxfFilePath && 
        mergedConfig && 
        Object.keys(mergedConfig).length > 0 && 
        configStr !== prevConfigRef.current) {
      
      console.log('[REACT] Config or rendering mode changed, reloading current DXF file');
      prevConfigRef.current = configStr;
      
      // Don't reload if we're already loading another file
      if (isLoading) return;
      
      // Set loading state to prevent duplicate processing
      setIsLoading(true);
      
      // Re-parse the DXF with the new config
      parseDXFWithConfig(dxfFilePath, mergedConfig)
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
  }, [rendererConfig, renderingMode, dxfFilePath, isLoading, parseDXFWithConfig]);

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
    setLayerVisibility({ [ORIGIN_AXES_LAYER]: true });
    setSelectedFeature(null);
  }, [ORIGIN_AXES_LAYER]);
  
  // Handle layer visibility changes
  const handleLayerVisibilityChange = useCallback((visibility: LayerVisibility) => {
    setLayerVisibility(visibility);
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
          onFileClose={handleFileClose}
          dxfData={dxfData}
          conversionFactor={conversionFactor}
          onConversionFactorChange={setConversionFactor}
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
            selectedFeature={selectedFeature}
            onFeatureSelect={setSelectedFeature}
            rendererConfig={{...rendererConfig, renderingMode}}
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