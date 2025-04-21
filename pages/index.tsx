import React, { useState, useEffect } from "react";
import type { SVGRendererConfig } from "../components/types";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import Modal from "../components/Modal";
import Canvas from "../components/Canvas";
import ResizablePanel from "../components/ResizablePanel";
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
      renderSVG: (filePath: string, config: SVGRendererConfig) => Promise<string>;
      parseDXFTree: (filePath: string) => Promise<string>;
      getRendererConfig: () => Promise<any>;
    };
  }
}

export default function Home() {
  const [showAccount, setShowAccount] = useState(false);
  const [svgData, setSvgData] = useState<string | null>(null);
  const [svgFilePath, setSvgFilePath] = useState<string | null>(null);
  const [rendererConfig, setRendererConfig] = useState<SVGRendererConfig>({});
  
  const [configError, setConfigError] = useState<string | null>(null);

  // Load config from JSON file without defaults
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await window.electron.getRendererConfig();
        if (config && config.DEFAULT_SVG_CONFIG) {
          setRendererConfig(config.DEFAULT_SVG_CONFIG);
          setConfigError(null);
        } else {
          setConfigError("Invalid configuration format");
        }
      } catch (error) {
        console.error('Error loading renderer config:', error);
        setConfigError(`Configuration error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    loadConfig();
  }, []);

  // handle selecting a new DXF file: render to SVG and store
  const handleFileSelect = async (filePath: string) => {
    setSvgFilePath(filePath);
    try {
      const svg = await window.electron.renderSVG(filePath, rendererConfig);
      setSvgData(svg);
    } catch (err) {
      console.error("Failed to render SVG:", err);
    }
  };

  // reload current SVG content from DXF file with current renderer config
  const reloadSvg = async () => {
    if (!svgFilePath) return;
    try {
      const svg = await window.electron.renderSVG(svgFilePath, rendererConfig);
      setSvgData(svg);
    } catch (err) {
      console.error("Failed to reload SVG:", err);
    }
  };

  // update renderer config and reload SVG
  const updateRendererConfig = (newConfig: Partial<SVGRendererConfig>) => {
    const updatedConfig = { ...rendererConfig, ...newConfig };
    setRendererConfig(updatedConfig);

    // Log config for debugging
    console.warn("UI Config Update:", JSON.stringify(updatedConfig, null, 2));

    // Reload SVG with new config if a file is loaded
    if (svgFilePath) {
      window.electron
        .renderSVG(svgFilePath, updatedConfig)
        .then((svg) => {
          console.log("SVG updated with new config");
          setSvgData(svg);
        })
        .catch((err) => console.error("Failed to update SVG rendering:", err));
    }
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
          filePath={svgFilePath}
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
            <p className="mt-2 text-sm">Please ensure the renderer_config.json file exists and is valid.</p>
          </div>
        ) : svgData ? (
          <Canvas
            data={svgData}
            rendererConfig={rendererConfig}
          />
        ) : (
          <div className="text-gray-500 text-xl">CAD Canvas Placeholder</div>
        )}
      </div>
      <ResizablePanel
        defaultWidth={sizes.sidebar.width}
        minWidth="180px"
        maxWidth="400px"
        position="right"
      >
        <RightSidebar />
      </ResizablePanel>

      {showAccount && (
        <Modal onClose={() => setShowAccount(false)}>
          <h2 className="text-2xl font-bold mb-4">Account</h2>
          <p className="text-gray-700">User account details go here.</p>
        </Modal>
      )}
    </div>
  );
}