import React from 'react';
import { ChevronRight, ChevronDown, Layers, FileText, Code, Cube, Box } from 'react-feather';

// Entity structure for DXF components
interface Entity {
  type: string;
  [key: string]: any;
}

interface FileComponentTreeProps {
  filePath: string | null;
}

export default function FileComponentTree({ filePath }: FileComponentTreeProps) {
  const [treeData, setTreeData] = React.useState<Record<string, Entity[]>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    setError(null);
    window.electron
      .parseDXFTree(filePath)
      .then((result: string) => {
        try {
          const data = JSON.parse(result);
          setTreeData(data);
        } catch {
          setError('Failed to parse DXF tree data.');
        }
      })
      .catch((err: any) => {
        setError(err.toString());
      })
      .finally(() => setLoading(false));
  }, [filePath]);

  if (!filePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
        <FileText size={32} className="mb-2 opacity-50" />
        <div className="text-center">No DXF file loaded.</div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
        <div className="animate-spin mb-2">
          <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div className="text-center">Loading component tree...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-red-400 p-4 bg-red-900 bg-opacity-20 rounded-md m-2 border border-red-800">
        <div className="font-medium mb-1">Error loading component tree</div>
        <div className="text-sm opacity-80">{error}</div>
      </div>
    );
  }

  // Build nested cascading dropdown: File > Layers > Feature Types > Features
  const layers = Object.entries(treeData);
  if (layers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
        <Layers size={32} className="mb-2 opacity-50" />
        <div className="text-center">No components found in DXF file.</div>
      </div>
    );
  }
  // Derive filename from path for top-level dropdown
  const fileName = filePath ? filePath.replace(/^.*[\\/]/, '') : 'DXF File';
  // Helper to group entities by type
  const groupByType = (entities: Entity[]): Record<string, Entity[]> =>
    entities.reduce((acc, ent) => {
      const t = ent.type || 'Unknown';
      (acc[t] = acc[t] || []).push(ent);
      return acc;
    }, {} as Record<string, Entity[]>);
  // Custom details summary component for consistent styling
  const CustomDetails = ({ 
    title, 
    count, 
    icon: Icon, 
    isOpen = false, 
    className = "", 
    children 
  }: { 
    title: string; 
    count?: number; 
    icon?: React.ElementType;
    isOpen?: boolean;
    className?: string;
    children: React.ReactNode;
  }) => {
    const [open, setOpen] = React.useState(isOpen);
    
    return (
      <div className={`mb-2 ${className}`}>
        <div 
          className={`flex items-center p-2 rounded-md transition-colors duration-200 cursor-pointer
            ${open ? 'bg-opacity-20 bg-white' : 'hover:bg-opacity-10 hover:bg-white'}`}
          onClick={() => setOpen(!open)}
        >
          {open ? <ChevronDown size={16} className="mr-1 flex-shrink-0" /> : <ChevronRight size={16} className="mr-1 flex-shrink-0" />}
          {Icon && <Icon size={16} className="mr-2 flex-shrink-0" />}
          <span className="font-medium">{title}</span>
          {count !== undefined && (
            <span className="ml-2 text-xs bg-opacity-30 bg-white px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        {open && <div className="ml-6 mt-1">{children}</div>}
      </div>
    );
  };

  return (
    <div className="text-sm text-gray-200 overflow-auto p-2">
      <CustomDetails 
        title={fileName} 
        icon={FileText} 
        isOpen={true}
      >
        {layers.map(([layer, entities]) => {
          const typesMap = groupByType(entities);
          
          return (
            <CustomDetails 
              key={layer} 
              title={layer} 
              count={entities.length} 
              icon={Layers}
            >
              {Object.entries(typesMap).map(([type, ents]) => (
                <CustomDetails 
                  key={type} 
                  title={type} 
                  count={ents.length} 
                  icon={Code}
                >
                  <div className="space-y-2">
                    {ents.map((entity, idx) => (
                      <CustomDetails 
                        key={idx} 
                        title={`Feature ${idx + 1}`} 
                        icon={Cube}
                        className="border-l border-gray-700 pl-2"
                      >
                        <div className="bg-opacity-10 bg-white rounded-md p-2 text-xs space-y-1.5">
                          {Object.entries(entity).map(([k, v]) => (
                            <div key={k} className="flex">
                              <span className="font-semibold text-gray-300 min-w-20">{k}</span>
                              <span className="font-mono text-gray-400 ml-2 overflow-hidden text-ellipsis">{JSON.stringify(v)}</span>
                            </div>
                          ))}
                        </div>
                      </CustomDetails>
                    ))}
                  </div>
                </CustomDetails>
              ))}
            </CustomDetails>
          );
        })}
      </CustomDetails>
    </div>
  );
}