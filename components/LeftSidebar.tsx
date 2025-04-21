import React, { useState, useEffect } from "react";
import FileComponentTree from "./FileComponentTree";
import {
  UserCircleIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import TabNavigator from "./TabNavigator";
import { colors, sizes, components } from "../styles/theme";

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
}

interface LeftSidebarProps {
  onAccount: () => void;
  onSvgLoad: (svg: string, filePath: string) => void;
  rendererConfig?: SVGRendererConfig;
}

export default function LeftSidebar({
  onAccount,
  onSvgLoad,
  rendererConfig,
}: LeftSidebarProps) {
  // open file dialog and render DXF to SVG
  const openFile = async () => {
    try {
      const { canceled, filePaths } = await window.electron.openFileDialog();
      if (canceled || !filePaths || filePaths.length === 0) return;
      // Render full SVG via ezdxf drawing add-on with current renderer config
      const svg = await window.electron.renderSVG(filePaths[0], rendererConfig);
      onSvgLoad && onSvgLoad(svg, filePaths[0]);
      setFilePath(filePaths[0]);
    } catch (err) {
      console.error("Failed to load DXF:", err);
    }
  };
  // hover state for themed secondary button
  const [fileButtonHovered, setFileButtonHovered] = React.useState(false);
  const [filePath, setFilePath] = React.useState<string | null>(null);
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
      <div className="flex items-center justify-start p-4">
        <button onClick={onAccount} className="hover:text-white">
          <UserCircleIcon className="h-6 w-6" aria-hidden="true" />
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
            icon: ClipboardDocumentListIcon,
            ariaLabel: "Open Files",
            content: (
              <div className="p-4">
                <FileComponentTree filePath={filePath} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}