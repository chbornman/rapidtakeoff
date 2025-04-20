import React from 'react';
import {
  PencilIcon,
  AdjustmentsHorizontalIcon,
  CogIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import TabNavigator from './TabNavigator';

export default function RightSidebar() {
  return (
    <div className="w-64 bg-gray-100 flex flex-col border-l border-gray-300">
      <TabNavigator
        defaultActive="draw"
        iconClassName="h-5 w-5"
        classNameTabBar="flex items-center justify-center p-2 space-x-4 border-b border-gray-300"
        classNameActiveTab="text-gray-700"
        classNameInactiveTab="text-gray-500 hover:text-gray-700"
        classNameSeparator="border-b-2 border-gray-300"
        classNameContent="p-4 flex-1 overflow-y-auto"
        tabs={[
          {
            id: 'draw',
            icon: PencilIcon,
            ariaLabel: 'Draw',
            content: (
              <div>
                <h3 className="text-gray-700 font-bold mb-2">Draw Tools</h3>
                <button className="flex items-center p-2 hover:bg-gray-200 rounded mb-1">
                  <PencilIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                  <span className="text-gray-700">Line</span>
                </button>
                <button className="flex items-center p-2 hover:bg-gray-200 rounded">
                  <PencilIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                  <span className="text-gray-700">Circle</span>
                </button>
              </div>
            ),
          },
          {
            id: 'modify',
            icon: AdjustmentsHorizontalIcon,
            ariaLabel: 'Modify',
            content: (
              <div>
                <h3 className="text-gray-700 font-bold mb-2">Modify Tools</h3>
                <button className="flex items-center p-2 hover:bg-gray-200 rounded mb-1">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                  <span className="text-gray-700">Move</span>
                </button>
                <button className="flex items-center p-2 hover:bg-gray-200 rounded">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                  <span className="text-gray-700">Rotate</span>
                </button>
              </div>
            ),
          },
          {
            id: 'settings',
            icon: CogIcon,
            ariaLabel: 'Settings',
            content: (
              <div>
                <h3 className="text-gray-700 font-bold mb-2">Settings</h3>
                <div className="text-gray-600">No settings available.</div>
              </div>
            ),
          },
          {
            id: 'info',
            icon: InformationCircleIcon,
            ariaLabel: 'Info',
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
    </div>
  );
}