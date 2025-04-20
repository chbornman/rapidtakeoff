import React from 'react';
import {
  UserCircleIcon,
  CogIcon,
  FolderIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import TabNavigator from './TabNavigator';
import { SVGRendererConfig, DEFAULT_SVG_CONFIG } from '../renderer_constants';

interface LeftSidebarProps {
  onAccount: () => void;
  onSettings: () => void;
  onSvgLoad: (svg: string, filePath: string) => void;
  rendererConfig?: SVGRendererConfig;
}

export default function LeftSidebar({ 
  onAccount, 
  onSettings, 
  onSvgLoad,
  rendererConfig = DEFAULT_SVG_CONFIG 
}: LeftSidebarProps) {
  // open file dialog and render DXF to SVG
  const openFile = async () => {
    try {
      const { canceled, filePaths } = await window.electron.openFileDialog();
      if (canceled || !filePaths || filePaths.length === 0) return;
      // Render full SVG via ezdxf drawing add-on with current renderer config
      const svg = await window.electron.renderSVG(filePaths[0], rendererConfig);
      onSvgLoad && onSvgLoad(svg, filePaths[0]);
    } catch (err) {
      console.error('Failed to load DXF:', err);
    }
  };
  return (
    <div className="w-64 bg-gray-800 text-gray-100 flex flex-col">
      {/* Top icons */}
      <div className="flex items-center justify-between p-4">
        <button onClick={onAccount} className="hover:text-white">
          <UserCircleIcon className="h-6 w-6" aria-hidden="true" />
        </button>
        <button onClick={onSettings} className="hover:text-white">
          <CogIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
      {/* Tabs */}
      <TabNavigator
        tabs={[
          {
            id: 'navigator',
            icon: FolderIcon,
            ariaLabel: 'Project Navigator',
            content: <div className="text-gray-200">Project Navigator Content</div>,
          },
          {
            id: 'files',
            icon: DocumentTextIcon,
            ariaLabel: 'Open Files',
            content: (
              <div className="p-4">
                <button
                  onClick={openFile}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
                >
                  Open DXF File
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}