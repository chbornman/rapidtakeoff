import React, { useState } from 'react';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import Modal from '../components/Modal';
import Canvas from '../components/Canvas';
import { SVGRendererConfig, DEFAULT_SVG_CONFIG } from '../renderer_constants';

export default function Home() {
  const [showAccount, setShowAccount] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [svgData, setSvgData] = useState<string | null>(null);
  const [svgFilePath, setSvgFilePath] = useState<string | null>(null);
  const [rendererConfig, setRendererConfig] = useState<SVGRendererConfig>({ ...DEFAULT_SVG_CONFIG });

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
      console.error('Failed to reload SVG:', err);
    }
  };

  // update renderer config and reload SVG
  const updateRendererConfig = (newConfig: Partial<SVGRendererConfig>) => {
    const updatedConfig = { ...rendererConfig, ...newConfig };
    setRendererConfig(updatedConfig);
    
    // Log config for debugging
    console.warn('UI Config Update:', JSON.stringify(updatedConfig, null, 2));
    
    // Reload SVG with new config if a file is loaded
    if (svgFilePath) {
      window.electron.renderSVG(svgFilePath, updatedConfig)
        .then(svg => {
          console.log('SVG updated with new config');
          setSvgData(svg);
        })
        .catch(err => console.error('Failed to update SVG rendering:', err));
    }
  };
  return (
    <div className="flex h-screen overflow-hidden">
      <LeftSidebar
        onAccount={() => setShowAccount(true)}
        onSettings={() => setShowSettings(true)}
        onSvgLoad={handleSvgLoad}
        rendererConfig={rendererConfig}
      />
      <div className="flex-1 bg-pink-300 flex items-center justify-center">
        {svgData ? (
          <>
            <Canvas 
              data={svgData} 
              onReload={reloadSvg} 
              rendererConfig={rendererConfig}
            />
            <div className="absolute bottom-2 right-2 z-10">
              <button
                onClick={() => updateRendererConfig({ debug_render: !rendererConfig.debug_render })}
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
      {showSettings && (
        <Modal onClose={() => setShowSettings(false)}>
          <h2 className="text-2xl font-bold mb-4">SVG Renderer Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Line Width</label>
              <input 
                type="number" 
                min="0.1" 
                max="5" 
                step="0.1"
                value={rendererConfig.line_width} 
                onChange={(e) => updateRendererConfig({ line_width: parseFloat(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Text Size Factor</label>
              <input 
                type="number" 
                min="0.1" 
                max="5" 
                step="0.1"
                value={rendererConfig.text_size_factor} 
                onChange={(e) => updateRendererConfig({ text_size_factor: parseFloat(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Line Color</label>
              <input 
                type="text" 
                placeholder="e.g., #0000FF or null for default"
                value={rendererConfig.line_color || ''}
                onChange={(e) => {
                  const value = e.target.value.trim() === '' ? null : e.target.value;
                  updateRendererConfig({ line_color: value });
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Text Color</label>
              <input 
                type="text" 
                placeholder="e.g., #FF0000 or null for default"
                value={rendererConfig.text_color || ''}
                onChange={(e) => {
                  const value = e.target.value.trim() === '' ? null : e.target.value;
                  updateRendererConfig({ text_color: value });
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Background Color</label>
              <input 
                type="text" 
                placeholder="e.g., #FFFFFF or null for transparent"
                value={rendererConfig.bg_color || ''}
                onChange={(e) => {
                  const value = e.target.value.trim() === '' ? null : e.target.value;
                  updateRendererConfig({ bg_color: value });
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="show_paper_border"
                checked={rendererConfig.show_paper_border || false}
                onChange={(e) => updateRendererConfig({ show_paper_border: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="show_paper_border" className="ml-2 block text-sm text-gray-700">
                Show Paper Border
              </label>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="vector_effect"
                checked={rendererConfig.vector_effect !== false}
                onChange={(e) => updateRendererConfig({ vector_effect: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="vector_effect" className="ml-2 block text-sm text-gray-700">
                Use non-scaling stroke (may affect visibility)
              </label>
            </div>
            
            <div className="pt-4">
              <button
                onClick={() => {
                  setRendererConfig({ ...DEFAULT_SVG_CONFIG });
                  if (svgFilePath) {
                    window.electron.renderSVG(svgFilePath, DEFAULT_SVG_CONFIG)
                      .then(svg => setSvgData(svg))
                      .catch(err => console.error('Failed to reset SVG rendering:', err));
                  }
                }}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}