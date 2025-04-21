import React from 'react';
import { ChevronRight, ChevronDown, Layers, FileText, Code, Cube, Box } from 'react-feather';
import { Entity, SelectedFeature } from './types';

interface FileComponentTreeProps {
  filePath: string | null;
  onFeatureSelect?: (feature: SelectedFeature | null) => void;
}

// Define the custom details component outside the main component
const TreeDetail = ({ 
  title, 
  count, 
  icon: Icon, 
  isOpen = false, 
  className = "", 
  children,
  onClick,
  onToggle,
  openState
}: { 
  title: string; 
  count?: number; 
  icon?: React.ElementType;
  isOpen?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  onToggle?: (id: string, isOpen: boolean) => void;
  openState?: boolean;
}) => {
  // Create a stable ID for this section
  const sectionId = React.useMemo(() => `${title}-${count ?? ''}`, [title, count]);
  
  // Use controlled open state if provided, otherwise use internal state
  const [internalOpen, setInternalOpen] = React.useState(isOpen);
  const open = openState !== undefined ? openState : internalOpen;
  
  // Handle toggle
  const handleToggle = React.useCallback(() => {
    if (onToggle) {
      onToggle(sectionId, !open);
    } else {
      setInternalOpen(!open);
    }
  }, [open, sectionId, onToggle]);
  
  return (
    <div className={`mb-1 ${className}`}>
      <div className="flex items-center justify-between">
        <div 
          className={`flex flex-grow items-center p-1 rounded-md transition-colors duration-200 cursor-pointer
            ${open ? 'bg-opacity-20 bg-white' : 'hover:bg-opacity-10 hover:bg-white'}`}
          onClick={handleToggle}
        >
          {open ? <ChevronDown size={12} className="mr-1 flex-shrink-0" /> : <ChevronRight size={12} className="mr-1 flex-shrink-0" />}
          {Icon && <Icon size={12} className="mr-1 flex-shrink-0" />}
          <span className="font-medium truncate">{title}</span>
          {count !== undefined && (
            <span className="ml-1 text-xs bg-opacity-30 bg-white px-1.5 py-0 rounded-full">
              {count}
            </span>
          )}
        </div>
        {onClick && (
          <button 
            className={`ml-1 px-1.5 py-0.5 text-xs rounded ${className.includes('border-red-500') ? 'bg-red-700 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {className.includes('border-red-500') ? 'X' : '✓'}
          </button>
        )}
      </div>
      {open && <div className="ml-4 mt-0.5">{children}</div>}
    </div>
  );
};

export default function FileComponentTree({ 
  filePath, 
  onFeatureSelect 
}: FileComponentTreeProps) {
  const [treeData, setTreeData] = React.useState<Record<string, Entity[]>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = React.useState<SelectedFeature | null>(null);
  // State to track which sections have been manually opened
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

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
  
  // Handle feature selection
  const handleFeatureSelect = React.useCallback((layerName: string, entityType: string, entityIndex: number, entity: Entity) => {
    const newSelectedFeature = {
      layerName,
      entityType,
      entityIndex,
      entity
    };
    
    console.log("Selecting feature:", newSelectedFeature);
    
    // If selecting the same feature again, deselect it
    if (selectedFeature &&
        selectedFeature.layerName === layerName && 
        selectedFeature.entityType === entityType && 
        selectedFeature.entityIndex === entityIndex) {
      setSelectedFeature(null);
      if (onFeatureSelect) {
        console.log("Deselecting feature");
        onFeatureSelect(null);
      }
    } else {
      setSelectedFeature(newSelectedFeature);
      if (onFeatureSelect) {
        console.log("Passing selection to parent:", newSelectedFeature);
        onFeatureSelect(newSelectedFeature);
      }
    }
  }, [selectedFeature, onFeatureSelect]);
  
  // Handle toggling section open/close state
  const handleSectionToggle = React.useCallback((sectionId: string, isOpen: boolean) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: isOpen
    }));
  }, []);
  
  // Helper to check if a section is open
  const isSectionOpen = React.useCallback((sectionId: string) => {
    return openSections[sectionId] || false;
  }, [openSections]);

  // Conditional rendering based on loading/error states
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

  return (
    <div className="text-xs text-gray-200 overflow-auto p-0">
      <TreeDetail 
        title={fileName} 
        icon={FileText} 
        isOpen={false}
        onToggle={handleSectionToggle}
        openState={isSectionOpen(`${fileName}-`)}
      >
        {layers.map(([layer, entities]) => {
          const typesMap = groupByType(entities);
          const layerId = `${layer}-${entities.length}`;
          
          return (
            <TreeDetail 
              key={layer} 
              title={layer} 
              count={entities.length} 
              icon={Layers}
              isOpen={false}
              onToggle={handleSectionToggle}
              openState={isSectionOpen(layerId)}
            >
              {Object.entries(typesMap).map(([type, ents]) => {
                const typeId = `${type}-${ents.length}`;
                
                return (
                  <TreeDetail 
                    key={type} 
                    title={type} 
                    count={ents.length} 
                    icon={Code}
                    isOpen={false}
                    onToggle={handleSectionToggle}
                    openState={isSectionOpen(typeId)}
                  >
                    <div className="space-y-2">
                      {ents.map((entity, idx) => {
                        const isSelected = selectedFeature && 
                          selectedFeature.layerName === layer &&
                          selectedFeature.entityType === type &&
                          selectedFeature.entityIndex === idx;
                        
                        const featureId = `Feature ${idx + 1}-`;
                        
                        return (
                          <TreeDetail 
                            key={idx} 
                            title={`Feature ${idx + 1}`} 
                            icon={Cube}
                            isOpen={false}
                            className={`border-l ${isSelected ? 'border-red-500' : 'border-gray-700'} pl-2`}
                            onClick={() => handleFeatureSelect(layer, type, idx, entity)}
                            onToggle={handleSectionToggle}
                            openState={isSectionOpen(featureId)}
                          >
                            <div 
                              className={`${isSelected ? 'bg-red-900 bg-opacity-20' : 'bg-white bg-opacity-10'} rounded-md p-2 text-xs space-y-1.5 cursor-pointer`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeatureSelect(layer, type, idx, entity);
                              }}
                            >
                              <div className="flex justify-between mb-2">
                                <span className={`${isSelected ? 'text-red-400' : 'text-gray-400'} text-sm font-medium`}>
                                  {isSelected ? 'Selected' : 'Properties'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {isSelected ? 'Click to deselect' : 'Click to select'}
                                </span>
                              </div>
                              {Object.entries(entity).map(([k, v]) => (
                                <div key={k} className="flex">
                                  <span className="font-semibold text-gray-300 min-w-20">{k}</span>
                                  <span className="font-mono text-gray-400 ml-2 overflow-hidden text-ellipsis">{JSON.stringify(v)}</span>
                                </div>
                              ))}
                            </div>
                          </TreeDetail>
                        );
                      })}
                    </div>
                  </TreeDetail>
                );
              })}
            </TreeDetail>
          );
        })}
      </TreeDetail>
    </div>
  );
}