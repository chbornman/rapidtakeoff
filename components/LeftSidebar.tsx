import React from "react";
import {
  UserCircleIcon,
  CogIcon,
  FolderIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import TabNavigator from "./TabNavigator";
import { SVGRendererConfig, DEFAULT_SVG_CONFIG } from "../renderer_constants";
import { colors, sizes, components } from "../styles/theme";

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
  rendererConfig = DEFAULT_SVG_CONFIG,
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
      console.error("Failed to load DXF:", err);
    }
  };
  // hover state for themed secondary button
  const [fileButtonHovered, setFileButtonHovered] = React.useState(false);
  return (
    <div
      className="w-64 flex flex-col"
      style={{
        backgroundColor: colors.background.sidebar,
        color: colors.onPrimary,
        width: sizes.sidebar.width,
      }}
    >
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
            id: "navigator",
            icon: FolderIcon,
            ariaLabel: "Project Navigator",
            content: (
              <div className="p-4">
                <button
                  onClick={openFile}
                  className="w-full"
                  style={{
                    backgroundColor: fileButtonHovered
                      ? components.button.secondary.hoverBackgroundColor
                      : components.button.secondary.backgroundColor,
                    color: components.button.secondary.textColor,
                    borderRadius: components.button.secondary.borderRadius,
                    padding: components.button.secondary.padding,
                  }}
                  onMouseEnter={() => setFileButtonHovered(true)}
                  onMouseLeave={() => setFileButtonHovered(false)}
                >
                  Open DXF File
                </button>
              </div>
            ),
          },
          {
            id: "files",
            icon: DocumentTextIcon,
            ariaLabel: "Open Files",
            content: <div className="text-gray-200">File Component Tree</div>,
          },
        ]}
      />
    </div>
  );
}
