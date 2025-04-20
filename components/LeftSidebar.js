import React from 'react';
import {
  UserCircleIcon,
  CogIcon,
  FolderIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import TabNavigator from './TabNavigator';

export default function LeftSidebar({ onAccount, onSettings, onFileLoad }) {
  // open file dialog and parse DXF
  const openFile = async () => {
    try {
      const { canceled, filePaths } = await window.electron.openFileDialog();
      if (canceled || !filePaths || filePaths.length === 0) return;
      const data = await window.electron.parseDXF(filePaths[0]);
      onFileLoad && onFileLoad(data);
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