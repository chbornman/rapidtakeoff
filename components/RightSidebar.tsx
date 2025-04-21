import React, { useState } from "react";
import {
  PencilIcon,
  AdjustmentsHorizontalIcon,
  CogIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import TabNavigator from "./TabNavigator";
import {
  colors,
  components,
  typography,
  spacing,
  sizes,
} from "../styles/theme";

export default function RightSidebar() {
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
          defaultActive="draw"
          iconClassName="h-5 w-5"
          classNameTabBar="flex items-center justify-center p-2 space-x-4 border-b"
          classNameActiveTab="text-white font-bold"
          classNameInactiveTab="text-white text-opacity-70 hover:text-opacity-100"
          classNameSeparator="border-b-2 border-white"
          classNameContent="p-4 flex-1 overflow-y-auto"
          tabs={[
            {
              id: "draw",
              icon: PencilIcon,
              ariaLabel: "Draw",
              content: (
                <div>
                  <h3 className="font-bold mb-2">Draw Tools</h3>
                  <button
                    className="flex items-center p-2 hover:bg-opacity-20 rounded mb-1 w-full"
                    style={{
                      // Use theme sidebar item background
                      backgroundColor: components.sidebar.itemBackground,
                    }}
                  >
                    <PencilIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    <span>Line</span>
                  </button>
                  <button
                    className="flex items-center p-2 hover:bg-opacity-20 rounded w-full"
                    style={{
                      // Use theme sidebar item background
                      backgroundColor: components.sidebar.itemBackground,
                    }}
                  >
                    <PencilIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    <span>Circle</span>
                  </button>
                </div>
              ),
            },
            {
              id: "modify",
              icon: AdjustmentsHorizontalIcon,
              ariaLabel: "Modify",
              content: (
                <div>
                  <h3 className="font-bold mb-2">Modify Tools</h3>
                  <button
                    className="flex items-center p-2 hover:bg-opacity-20 rounded mb-1 w-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  >
                    <AdjustmentsHorizontalIcon
                      className="h-5 w-5 mr-2"
                      aria-hidden="true"
                    />
                    <span>Move</span>
                  </button>
                  <button
                    className="flex items-center p-2 hover:bg-opacity-20 rounded w-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  >
                    <AdjustmentsHorizontalIcon
                      className="h-5 w-5 mr-2"
                      aria-hidden="true"
                    />
                    <span>Rotate</span>
                  </button>
                </div>
              ),
            },
            {
              id: "settings",
              icon: CogIcon,
              ariaLabel: "Settings",
              content: (
                <div>
                  <h3 className="font-bold mb-2">Settings</h3>
                  <div className="text-white text-opacity-80">
                    No settings available.
                  </div>
                </div>
              ),
            },
            {
              id: "info",
              icon: InformationCircleIcon,
              ariaLabel: "Info",
              content: (
                <div>
                  <h3 className="text-gray-700 font-bold mb-2">Information</h3>
                  <div className="text-gray-600">Version 1.0.0</div>
                  <div className="text-gray-600">Build date: 2025-04-20</div>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
