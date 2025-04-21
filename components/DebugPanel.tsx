import React, { useState, useEffect } from 'react';

// Define window._debugLogs globally for TypeScript
declare global {
  interface Window {
    _debugLogs?: Array<{
      type: string;
      message: string;
      timestamp: string;
    }>;
  }
}

// Initialize the debug logs array if needed
if (typeof window !== 'undefined' && !window._debugLogs) {
  window._debugLogs = [];
}

interface DebugPanelProps {
  maxLogs?: number;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ maxLogs = 20 }) => {
  const [logs, setLogs] = useState<Array<{ type: string; message: string; timestamp: string }>>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [filter, setFilter] = useState<string>('');

  // Poll for new logs
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      if (window._debugLogs) {
        setLogs([...window._debugLogs].slice(-maxLogs));
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [isVisible, maxLogs]);

  // Filter logs based on type or message content
  const filteredLogs = filter 
    ? logs.filter(log => 
        log.type.includes(filter) || 
        log.message.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-gray-900 text-white h-32 border-t border-gray-700 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'transform-none' : 'transform translate-y-full'
      }`}
    >
      <div className="flex justify-between items-center p-1 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center">
          <h3 className="text-sm font-bold mr-2">Debug Logs</h3>
          <input
            type="text"
            placeholder="Filter logs..."
            className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md w-40"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          <button 
            className="text-xs bg-blue-600 px-2 py-1 rounded-md"
            onClick={() => {
              if (window._debugLogs) window._debugLogs = [];
              setLogs([]);
            }}
          >
            Clear
          </button>
          <button 
            className="text-xs bg-gray-700 px-2 py-1 rounded-md"
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      
      <div className="text-xs overflow-y-auto h-[calc(100%-28px)]">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-400 p-2">No logs yet. Try opening a DXF file.</div>
        ) : (
          filteredLogs.map((log, index) => (
            <div 
              key={index} 
              className={`border-b border-gray-700 py-1 px-2 ${
                log.type.includes('error') ? 'bg-red-900' : 
                log.type.includes('warn') ? 'bg-yellow-900' : 
                'bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-gray-400">{log.timestamp.split('T')[1].split('.')[0]}</span>
                <span className="bg-gray-700 rounded-full px-2 text-xs">{log.type}</span>
              </div>
              <div className="mt-1 whitespace-pre-wrap break-all">{log.message}</div>
            </div>
          ))
        )}
      </div>
      
      {/* Toggle button fixed at the bottom when panel is hidden */}
      {!isVisible && (
        <button 
          className="fixed bottom-0 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded-t-md opacity-70 hover:opacity-100 z-50"
          onClick={() => setIsVisible(true)}
        >
          Show Debug Logs
        </button>
      )}
    </div>
  );
};

export default DebugPanel;