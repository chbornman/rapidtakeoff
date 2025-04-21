import React, { useState } from "react";
import FileComponentTree from "./FileComponentTree";
import {
  UserCircleIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import TabNavigator from "./TabNavigator";
import { colors, sizes, components } from "../styles/theme";

interface LeftSidebarProps {
  onAccount: () => void;
  onFileSelect: (filePath: string) => void;
  filePath?: string | null;
}

export default function LeftSidebar({
  onAccount,
  onFileSelect,
  filePath,
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
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <RocketLaunchIcon className="h-6 w-6" aria-hidden="true" />
            <span className="text-lg font-semibold">Rapid Takeoff</span>
          </div>
        )}
        {!collapsed && (
          <button onClick={onAccount} className="hover:text-white">
            <UserCircleIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-6 w-6" aria-hidden="true" />
          ) : (
            <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
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
      )}
    </div>
  );
}
