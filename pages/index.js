import React, { useState } from 'react';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import Modal from '../components/Modal';
import Canvas from '../components/Canvas';

export default function Home() {
  const [showAccount, setShowAccount] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dxfData, setDxfData] = useState(null);
  // handle loading DXF geometry
  const handleFileLoad = (data) => {
    setDxfData(data);
  };
  return (
    <div className="flex h-screen overflow-hidden">
      <LeftSidebar
        onAccount={() => setShowAccount(true)}
        onSettings={() => setShowSettings(true)}
        onFileLoad={handleFileLoad}
      />
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        {dxfData ? (
          <Canvas data={dxfData} />
        ) : (
          <div className="text-gray-500 text-xl">CAD Canvas Placeholder</div>
        )}
      </div>
      <RightSidebar />

      {showAccount && (
        <Modal onClose={() => setShowAccount(false)}>
          <h2 className="text-2xl font-bold mb-4">Account</h2>
          <p className="text-gray-700">User account details go here.</p>
        </Modal>
      )}
      {showSettings && (
        <Modal onClose={() => setShowSettings(false)}>
          <h2 className="text-2xl font-bold mb-4">Settings</h2>
          <p className="text-gray-700">Application settings go here.</p>
        </Modal>
      )}
    </div>
  );
}