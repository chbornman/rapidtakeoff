import React from 'react';
import { ChevronRight, ChevronDown, Layers, FileText, Code, Cube, Eye, EyeOff } from 'react-feather';
import { Entity, SelectedFeature, DXFData, LayerVisibility } from './types';

interface ComponentTreeProps {
  filePath: string | null;
  onFeatureSelect?: (feature: SelectedFeature | null) => void;
  /** Optional callback to change layer visibility, integrated into the component tree */
  onLayerVisibilityChange?: (visibility: LayerVisibility) => void;
  /** Optional callback to change component visibility, integrated into the component tree */
  onComponentVisibilityChange?: (visibility: Record<string, Record<string, boolean>>) => void;
}

// Default tree data for when no file is loaded (show origin axes)
const defaultTreeData: DXFData = {
  'Origin Axes': [
    { type: 'X Axis' },
    { type: 'Y Axis' },
  ],
};
// Helper to group entities by type
const groupByType = (entities: Entity[]): Record<string, Entity[]> => {
  return entities.reduce((acc, ent) => {
    const t = ent.type || 'Unknown';
    (acc[t] = acc[t] || []).push(ent);
    return acc;
  }, {} as Record<string, Entity[]>);
};
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
  openState,
  visible = true,
  onVisibilityToggle,
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
  visible?: boolean;
  onVisibilityToggle?: () => void;
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
        <div className="flex items-center space-x-1">
          {onVisibilityToggle && (
            <button
              className="p-1 rounded hover:bg-gray-700"
              onClick={(e) => { e.stopPropagation(); onVisibilityToggle(); }}
              aria-label={visible ? 'Hide' : 'Show'}
            >
              {visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          )}
          {onClick && (
            <button 
              className={`px-1.5 py-0.5 text-xs rounded ${className.includes('border-red-500') ? 'bg-red-700 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              {className.includes('border-red-500') ? 'X' : '✓'}
            </button>
          )}
        </div>
      </div>
      {open && <div className="ml-4 mt-0.5">{children}</div>}
    </div>
  );
};

export default function FileComponentTree({ 
  filePath, 
  onFeatureSelect,
  onLayerVisibilityChange,
  onComponentVisibilityChange,
}: ComponentTreeProps) {
  const [treeData, setTreeData] = React.useState<Record<string, Entity[]>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = React.useState<SelectedFeature | null>(null);
  // State to track which sections have been manually opened
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});
  // Local visibility state for layers and components
  const [layerVisibilityLocal, setLayerVisibilityLocal] = React.useState<LayerVisibility>({});
  const [componentVisibilityLocal, setComponentVisibilityLocal] = React.useState<Record<string, Record<string, boolean>>>({});
  // Compute global set of entity types across all layers
  const globalTypes = React.useMemo(() => {
    const typesSet = new Set<string>();
    Object.entries(treeData).forEach(([layer, entities]) => {
      const typesMap = groupByType(entities);
      Object.keys(typesMap).forEach(t => typesSet.add(t));
    });
    return Array.from(typesSet);
  }, [treeData]);

  React.useEffect(() => {
    if (!filePath) {
      // No file loaded: show default tree with origin axes
      setTreeData(defaultTreeData);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    window.electron
      .parseDXFTree(filePath)
      .then((result: string) => {
        try {
          const data = JSON.parse(result);
          // Only use DXF data without adding Origin Axes since it's shown separately
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
  
  // Get the filename early to avoid reference errors
  const getFileName = React.useCallback(() => {
    return filePath ? filePath.replace(/^.*[\\/]/, '') : 'DXF File';
  }, [filePath]);
  
  // Ensure the tree path to a feature is open
  const ensurePathToFeatureIsOpen = React.useCallback((layerName: string, entityType: string) => {
    // Get the current filename
    const currentFileName = getFileName();
    
    // Open the file node
    const fileId = `${currentFileName}-`;
    setOpenSections(prev => ({
      ...prev,
      [fileId]: true
    }));
    
    // Open the layer node
    const layerId = `${layerName}-`;
    setOpenSections(prev => ({
      ...prev,
      [layerId]: true
    }));
    
    // Open the entity type node
    const typeId = `${entityType}-`;
    setOpenSections(prev => ({
      ...prev,
      [typeId]: true
    }));
  }, [getFileName, setOpenSections]);
  
  // Handle feature selection
  const handleFeatureSelect = React.useCallback((layerName: string, entityType: string, entityIndex: number, entity: Entity) => {
    const newSelectedFeature = {
      layerName,
      entityType,
      entityIndex,
      entity
    };
    
    // If selecting the same feature again, deselect it
    if (selectedFeature &&
        selectedFeature.layerName === layerName && 
        selectedFeature.entityType === entityType && 
        selectedFeature.entityIndex === entityIndex) {
      setSelectedFeature(null);
      if (onFeatureSelect) {
        onFeatureSelect(null);
      }
    } else {
      setSelectedFeature(newSelectedFeature);
      if (onFeatureSelect) {
        onFeatureSelect(newSelectedFeature);
      }
      
      // Auto-expand tree to show the selected feature
      ensurePathToFeatureIsOpen(layerName, entityType);
    }
  }, [selectedFeature, onFeatureSelect, ensurePathToFeatureIsOpen]);
  
  // Initialize visibility maps whenever treeData changes
  React.useEffect(() => {
    // Skip if no tree data to avoid unnecessary renders
    if (Object.keys(treeData).length === 0) return;
    
    // Check if we need to initialize visibility (only do this once for new data)
    const needsInitialization = Object.keys(treeData).some(layer => 
      layerVisibilityLocal[layer] === undefined || 
      !componentVisibilityLocal[layer]
    );
    
    if (!needsInitialization) return;

    // Initialize layer visibility (including Origin Axes layer)
    const lv: LayerVisibility = { ...layerVisibilityLocal };
    if (lv['Origin & Axes'] === undefined) lv['Origin & Axes'] = true;
    
    const cv: Record<string, Record<string, boolean>> = { ...componentVisibilityLocal };
    
    // Process entity visibility by layer and type
    Object.entries(treeData).forEach(([layer, entities]) => {
      // Set default layer visibility to true if not already set
      if (lv[layer] === undefined) {
        lv[layer] = true;
      }
      
      // Initialize component visibility for this layer if needed
      if (!cv[layer]) {
        cv[layer] = {};
      }
      
      // For each entity, set initial visibility if not already set
      entities.forEach((entity, idx) => {
        const entityKey = `${layer}:${entity.type}:${idx}`;
        // Only set if not already defined
        if (cv[layer][entityKey] === undefined) {
          cv[layer][entityKey] = true;
        }
      });
    });
    
    setLayerVisibilityLocal(lv);
    setComponentVisibilityLocal(cv);
    if (onLayerVisibilityChange) onLayerVisibilityChange(lv);
    if (onComponentVisibilityChange) onComponentVisibilityChange?.(cv);
  }, [treeData, onLayerVisibilityChange, onComponentVisibilityChange]);

  // Handle external selection updates (when feature is selected from canvas)
  React.useEffect(() => {
    // Check if we have an incoming selection from props
    if (onFeatureSelect && selectedFeature) {
      // Ensure the tree is expanded to show the selected feature
      ensurePathToFeatureIsOpen(selectedFeature.layerName, selectedFeature.entityType);
    }
  }, [selectedFeature, ensurePathToFeatureIsOpen]);
  
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
  const showEmptyState = filePath && layers.length === 0;
  
  if (showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
        <Layers size={32} className="mb-2 opacity-50" />
        <div className="text-center">No components found in DXF file.</div>
      </div>
    );
  }
  
  // Derive filename from path for top-level dropdown
  const fileName = filePath ? filePath.replace(/^.*[\\/]/, '') : 'DXF File';

  return (
    <div className="text-xs text-gray-200 overflow-auto p-0">
      {/* Origin Axes as a separate top-level component */}
      <TreeDetail 
        key="Origin Axes"
        title="Origin Axes" 
        icon={Layers} 
        isOpen={false}
        onToggle={handleSectionToggle}
        openState={isSectionOpen("Origin Axes-")}
        visible={layerVisibilityLocal['Origin & Axes']}
        onVisibilityToggle={() => {
          const newLV = { ...layerVisibilityLocal, 'Origin & Axes': !layerVisibilityLocal['Origin & Axes'] };
          setLayerVisibilityLocal(newLV);
          onLayerVisibilityChange?.(newLV);
        }}
      >
        {defaultTreeData['Origin Axes'].map((entity, idx) => (
          <TreeDetail 
            key={`axis-${idx}`}
            title={entity.type} 
            icon={Cube}
            isOpen={false}
            className="border-l border-gray-700 pl-2"
          />
        ))}
      </TreeDetail>
      
      {/* File and its layers */}
      {filePath && (
        <TreeDetail 
          title={fileName} 
          icon={FileText} 
          isOpen={false}
          onToggle={handleSectionToggle}
          openState={isSectionOpen(`${fileName}-`)}
        >
          {layers.filter(([layer]) => layer !== 'Origin Axes').map(([layer, entities]) => {
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
                visible={layerVisibilityLocal[layer]}
                onVisibilityToggle={() => {
                  // Toggle layer visibility
                  const newLayerVisible = !layerVisibilityLocal[layer];
                  const newLV = { ...layerVisibilityLocal, [layer]: newLayerVisible };
                  setLayerVisibilityLocal(newLV);
                  
                  // When hiding a layer, hide all entities within it
                  if (!newLayerVisible) {
                    // Create updated component visibility map
                    const newCV = { ...componentVisibilityLocal };
                    
                    // If the layer is hidden, hide all components in this layer
                    if (newCV[layer]) {
                      Object.keys(newCV[layer]).forEach(entityKey => {
                        newCV[layer][entityKey] = false;
                      });
                      setComponentVisibilityLocal(newCV);
                      onComponentVisibilityChange?.(newCV);
                    }
                  }
                  
                  // Propagate layer visibility change
                  onLayerVisibilityChange?.(newLV);
                }}
              >
                {Object.entries(typesMap).map(([type, ents]) => {
                  const typeId = `${type}-${ents.length}`;
                  
                  // Type-level visibility: toggle all features of this type
                  const featureKeys = ents.map((_, idx) => `${layer}:${type}:${idx}`);
                  const allVisible = featureKeys.every(k => componentVisibilityLocal[layer]?.[k]);
                  const toggleTypeVisibility = () => {
                    // Only allow visibility toggle if parent layer is visible
                    if (!layerVisibilityLocal[layer] && allVisible === false) {
                      // If trying to show entities in a hidden layer, make the layer visible first
                      const newLV = { ...layerVisibilityLocal, [layer]: true };
                      setLayerVisibilityLocal(newLV);
                      onLayerVisibilityChange?.(newLV);
                    }
                    
                    // Toggle visibility for all entities of this type
                    const newCV = { ...componentVisibilityLocal };
                    newCV[layer] = { ...newCV[layer] };
                    featureKeys.forEach(k => { newCV[layer][k] = !allVisible; });
                    setComponentVisibilityLocal(newCV);
                    onComponentVisibilityChange?.(newCV);
                  };
                  return (
                    <TreeDetail 
                      key={type}
                      title={type}
                      count={ents.length}
                      icon={Code}
                      isOpen={false}
                      onToggle={handleSectionToggle}
                      openState={isSectionOpen(typeId)}
                      visible={allVisible}
                      onVisibilityToggle={toggleTypeVisibility}
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
                              visible={componentVisibilityLocal[layer]?.[`${layer}:${type}:${idx}`]}
                              onVisibilityToggle={() => {
                                const entityKey = `${layer}:${type}:${idx}`;
                                const newVisible = !componentVisibilityLocal[layer]?.[entityKey];
                                
                                // If showing an entity in a hidden layer, make the layer visible first
                                if (newVisible && !layerVisibilityLocal[layer]) {
                                  const newLV = { ...layerVisibilityLocal, [layer]: true };
                                  setLayerVisibilityLocal(newLV);
                                  onLayerVisibilityChange?.(newLV);
                                }
                                
                                // Update entity visibility
                                const newCV = { ...componentVisibilityLocal };
                                newCV[layer] = { ...newCV[layer], [entityKey]: newVisible };
                                setComponentVisibilityLocal(newCV);
                                onComponentVisibilityChange?.(newCV);
                              }}
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
      )}
      
      {/* Global Entity Type Visibility Toggles */}
      <div className="p-2 border-t border-gray-700">
        <div className="font-medium mb-1">Entity Types</div>
        {globalTypes.map(type => {
          // keys for this type across all layers
          const keysForType = layers.flatMap(([layer, entities]) => {
            const entsOfType = groupByType(entities)[type] || [];
            return entsOfType.map((_, idx) => `${layer}:${type}:${idx}`);
          });
          const allVisibleType = keysForType.every(keyStr => {
            const [layerName] = keyStr.split(':');
            return componentVisibilityLocal[layerName]?.[keyStr];
          });
          const toggleGlobalType = () => {
            const newVisible = !allVisibleType;
            const newCV = { ...componentVisibilityLocal };
            
            // If showing entities, make sure their layers are visible too
            if (newVisible) {
              const affectedLayers = new Set<string>();
              
              // Collect all layers that have this entity type
              layers.forEach(([layer, entities]) => {
                const entsOfType = groupByType(entities)[type] || [];
                if (entsOfType.length > 0) {
                  affectedLayers.add(layer);
                }
              });
              
              // Make sure all affected layers are visible
              if (affectedLayers.size > 0) {
                const newLV = { ...layerVisibilityLocal };
                affectedLayers.forEach(layer => {
                  newLV[layer] = true;
                });
                setLayerVisibilityLocal(newLV);
                onLayerVisibilityChange?.(newLV);
              }
            }
            
            // Toggle visibility for all entities of this type across all layers
            layers.forEach(([layer, entities]) => {
              const entsOfType = groupByType(entities)[type] || [];
              if (entsOfType.length > 0) {
                newCV[layer] = { ...newCV[layer] };
                entsOfType.forEach((_, idx) => {
                  const key = `${layer}:${type}:${idx}`;
                  newCV[layer][key] = newVisible;
                });
              }
            });
            
            setComponentVisibilityLocal(newCV);
            onComponentVisibilityChange?.(newCV);
          };
          return (
            <div key={type} className="flex items-center justify-between mb-1">
              <span className="truncate">{type}</span>
              <button
                onClick={toggleGlobalType}
                className="p-1 rounded hover:bg-gray-700"
                aria-label={allVisibleType ? 'Hide all' : 'Show all'}
              >
                {allVisibleType ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}