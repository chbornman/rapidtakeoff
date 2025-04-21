import React, { useState } from "react";
import ComponentTree from "./ComponentTree";
import {
  UserCircleIcon,
  FolderIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import TabNavigator from "./TabNavigator";
import { colors, sizes, components } from "../styles/theme";

import { SelectedFeature, LayerVisibility } from "./types";

interface LeftSidebarProps {
  onAccount: () => void;
  onFileSelect: (filePath: string) => void;
  filePath?: string | null;
  onFeatureSelect?: (feature: SelectedFeature | null) => void;
  /** Callback to change layer visibility, integrated into component tree */
  onLayerVisibilityChange: (visibility: LayerVisibility) => void;
  /** Callback to change component visibility state */
  onComponentVisibilityChange: (visibility: Record<string, Record<string, boolean>>) => void;
  /** Close the currently open DXF file */
  onFileClose: () => void;
}

export default function LeftSidebar({
  onAccount,
  onFileSelect,
  filePath,
  onFeatureSelect,
  onLayerVisibilityChange,
  onComponentVisibilityChange,
  onFileClose,
}: LeftSidebarProps) {
  // open file dialog and render DXF to SVG
  const openFile = async () => {
    try {
      const { canceled, filePaths } = await window.electron.openFileDialog();
      if (canceled || !filePaths || filePaths.length === 0) return;
      onFileSelect(filePaths[0]);
    } catch (err) {
      console.error("Failed to select DXF file:", err);
    }
  };
  // hover state for themed secondary button
  const [fileButtonHovered, setFileButtonHovered] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: colors.primary.dark,
        color: colors.onPrimary,
        width: collapsed ? sizes.sidebar.collapsedWidth : '100%',
      }}
    >
      {/* Header with title and controls */}
      <div className="flex items-center justify-between p-2">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <RocketLaunchIcon className="h-5 w-5" aria-hidden="true" />
            <span className="text-base font-semibold">Rapid Takeoff</span>
          </div>
        )}
        {!collapsed && (
          <button onClick={onAccount} className="hover:text-white">
            <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
      {!collapsed && (
        <TabNavigator
          defaultActive="navigator"
          tabs={[
            {
              id: "navigator",
              icon: FolderIcon,
              ariaLabel: "Project Navigator",
              content: (
                <div className="p-2 space-y-2">
                  <button
                    onClick={openFile}
                    className="w-full"
                    style={{
                      backgroundColor: fileButtonHovered
                        ? components.button.secondary.hoverBackgroundColor
                        : components.button.secondary.backgroundColor,
                      color: components.button.secondary.textColor,
                      borderRadius: components.button.secondary.borderRadius,
                      padding: "6px 10px",
                    }}
                    onMouseEnter={() => setFileButtonHovered(true)}
                    onMouseLeave={() => setFileButtonHovered(false)}
                  >
                    Open DXF File
                  </button>
                  {filePath && (
                    <button
                      onClick={onFileClose}
                      className="w-full"
                      style={{
                        backgroundColor: components.button.secondary.backgroundColor,
                        color: components.button.secondary.textColor,
                        borderRadius: components.button.secondary.borderRadius,
                        padding: "6px 10px",
                      }}
                    >
                      Close DXF File
                    </button>
                  )}
                  <ComponentTree
                    filePath={filePath}
                    onFeatureSelect={onFeatureSelect}
                    onLayerVisibilityChange={onLayerVisibilityChange}
                    onComponentVisibilityChange={onComponentVisibilityChange}
                  />
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
