import React, { useState, useEffect } from "react";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import Modal from "../components/Modal";
import Canvas from "../components/Canvas";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../styles/theme";

// Define SVGRendererConfig interface for ezdxf
interface SVGRendererConfig {
  lineweight?: number;
  text_size_factor?: number;
  text_color?: string | null;
  bg_color?: string | null;
  stroke_color?: string | null;
  show_paper_border?: boolean;
  use_vector_effect?: boolean;
  debug?: boolean;
  quality?: "low" | "medium" | "high";
  scale?: number;
  pdsize?: number | null;
  pdmode?: number | null;
  measurement?: number | null;
  show_defpoints?: boolean;
  proxy_graphic_policy?: string;
  line_policy?: string;
  hatch_policy?: string;
  infinite_line_length?: number;
  lineweight_scaling?: number;
  min_lineweight?: number | null;
  min_dash_length?: number;
  max_flattening_distance?: number;
  circle_approximation_count?: number;
  hatching_timeout?: number;
  min_hatch_line_distance?: number;
  color_policy?: string;
  custom_fg_color?: string;
  background_policy?: string;
  custom_bg_color?: string;
  lineweight_policy?: string;
  text_policy?: string;
  image_policy?: string;
};

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

  // handle loading SVG content (and store file path)
  const handleSvgLoad = (svg: string, filePath: string) => {
    setSvgData(svg);
    setSvgFilePath(filePath);
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
      <LeftSidebar
        onAccount={() => setShowAccount(true)}
        onSvgLoad={handleSvgLoad}
        rendererConfig={rendererConfig}
      />
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
          <>
            <Canvas
              data={svgData}
              onReload={reloadSvg}
              rendererConfig={rendererConfig}
            />
            <div className="absolute bottom-2 right-2 z-10">
              <button
                onClick={() =>
                  updateRendererConfig({
                    debug: !rendererConfig.debug,
                  })
                }
                className="p-1 bg-white bg-opacity-75 rounded hover:bg-gray-200"
                title="Toggle Debug Mode"
              >
                🐞
              </button>
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-xl">CAD Canvas Placeholder</div>
        )}
      </div>
      <RightSidebar />

      {showAccount && (
        <Modal onClose={() => setShowAccount(false)}>
          <h2 className="text-2xl font-bold mb-4">Account</h2>
          <p className="text-gray-700">User account details go here.</p>
        </Modal>
      )}
    </div>
  );
}