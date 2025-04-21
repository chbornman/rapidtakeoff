import React, { useState } from "react";
import ComponentTree from "./ComponentTree";
import {
  UserCircleIcon,
  FolderIcon,
  XCircleIcon,
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
  // Removed collapsed state for better usability
  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: colors.primary.dark,
        color: colors.onPrimary,
        width: '100%',
      }}
    >
      {/* Header with title and controls */}
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center space-x-2">
          <RocketLaunchIcon className="h-5 w-5" aria-hidden="true" />
          <span className="text-base font-semibold">Rapid Takeoff</span>
        </div>
        <button onClick={onAccount} className="hover:text-white">
          <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <TabNavigator
        defaultActive="navigator"
          tabs={[
            {
              id: "navigator",
              icon: FolderIcon,
              ariaLabel: "Project Navigator",
              content: (
                <div className="p-2 space-y-2">
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
      <div className="mt-auto flex justify-center p-2 border-t border-primary-light">
        <button
          onClick={filePath ? onFileClose : openFile}
          className={`px-4 py-2 rounded-md ${
            fileButtonHovered
              ? 'bg-primary-light text-white'
              : 'bg-primary-main text-white'
          } transition duration-150 w-full flex justify-center items-center space-x-2`}
          onMouseEnter={() => setFileButtonHovered(true)}
          onMouseLeave={() => setFileButtonHovered(false)}
        >
          {filePath ? (
            <>
              <XCircleIcon className="h-5 w-5" aria-hidden="true" />
              <span>Close DXF File</span>
            </>
          ) : (
            <>
              <FolderIcon className="h-5 w-5" aria-hidden="true" />
              <span>Open DXF File</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
