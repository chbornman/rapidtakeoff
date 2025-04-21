import React, { useState } from "react";
import {
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Square2StackIcon,
} from "@heroicons/react/24/outline";
import TabNavigator from "./TabNavigator";
import LayerManager from "./LayerManager";
import {
  colors,
  components,
  typography,
  spacing,
  sizes,
} from "../styles/theme";
import { DXFData, LayerVisibility } from "./types";

interface RightSidebarProps {
  dxfData: DXFData | null;
  onLayerVisibilityChange: (visibility: LayerVisibility) => void;
}

export default function RightSidebar({ 
  dxfData, 
  onLayerVisibilityChange 
}: RightSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <div
      className="flex flex-col border-l h-full"
      style={{
        backgroundColor: colors.primary.dark,
        color: colors.onPrimary,
        borderColor: colors.primary.dark,
        width: collapsed ? sizes.sidebar.collapsedWidth : '100%',
      }}
    >
      {/* Collapse control */}
      <div className="flex justify-end p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
      {!collapsed && (
        <TabNavigator
          defaultActive="layers"
          iconClassName="h-5 w-5"
          classNameTabBar="flex items-center justify-center p-2 space-x-4 border-b"
          classNameActiveTab="text-white font-bold"
          classNameInactiveTab="text-white text-opacity-70 hover:text-opacity-100"
          classNameSeparator="border-b-2 border-white"
          classNameContent="p-4 flex-1 overflow-y-auto"
          tabs={[
            {
              id: "layers",
              icon: Square2StackIcon,
              ariaLabel: "Layers",
              content: (
                <div>
                  <h3 className="font-bold mb-2">Layer Controls</h3>
                  <LayerManager 
                    dxfData={dxfData} 
                    onLayerVisibilityChange={onLayerVisibilityChange} 
                  />
                </div>
              ),
            },
            {
              id: "info",
              icon: InformationCircleIcon,
              ariaLabel: "Info",
              content: (
                <div>
                  <h3 className="text-gray-300 font-bold mb-2">Information</h3>
                  <div className="text-gray-400">Version 1.0.0</div>
                  <div className="text-gray-400">Build date: 2025-04-20</div>
                  <div className="text-gray-400 mt-4">
                    <h4 className="font-semibold mb-1">Controls:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Click on a feature to select it</li>
                      <li>Use the layer toggles to show/hide layers</li>
                      <li>Mouse wheel to zoom in/out</li>
                      <li>Middle mouse button to pan the canvas</li>
                    </ul>
                  </div>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}