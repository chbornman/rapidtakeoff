import React, { useState, useMemo, useEffect } from "react";
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import type { DXFData, Entity } from "./types";

interface EstimatorPanelProps {
  /** Parsed DXF data grouped by layer */
  dxfData: DXFData | null;
  /** Conversion factor: drawing units to linear feet */
  conversionFactor: number;
}

/**
 * Estimator panel: shows each layer, feature types, allows pricing per linear foot,
 * and computes total lengths and cost.
 */
const EstimatorPanel: React.FC<EstimatorPanelProps> = ({ dxfData, conversionFactor }) => {
  // Local state for price per foot, keyed by layer and feature type
  const [priceMap, setPriceMap] = useState<{
    [layer: string]: { [featureType: string]: number }
  }>({});
  
  // Track expanded feature types instead of layers - initialize with all expanded
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(() => {
    const expandedSet = new Set<string>();
    // We'll populate this in the first render using lengthsByLayer
    if (dxfData) {
      Object.entries(dxfData).forEach(([layer]) => {
        // We don't have feature types yet, so we'll add them in the effect below
        expandedSet.add(`${layer}|`); // Add a placeholder
      });
    }
    return expandedSet;
  });

  // Helper to compute length of a single entity in drawing units
  const getEntityLength = (entity: Entity): number => {
    const to2D = (pt: number[]): [number, number] => [pt[0] || 0, pt[1] || 0];
    switch (entity.type) {
      case "LINE": {
        const [x1, y1] = to2D((entity as any).start);
        const [x2, y2] = to2D((entity as any).end);
        return Math.hypot(x2 - x1, y2 - y1);
      }
      case "ARC": {
        const e = entity as any;
        const r: number = e.radius || 0;
        let start: number = e.start_angle || 0;
        let end: number = e.end_angle || 0;
        let delta = end - start;
        if (delta < 0) delta += 360;
        // large_arc flag may invert the shorter arc
        if (e.large_arc) delta = 360 - delta;
        const rad = delta * Math.PI / 180;
        return r * rad;
      }
      case "CIRCLE": {
        const r: number = (entity as any).radius || 0;
        return 2 * Math.PI * r;
      }
      default: {
        // Polylines and splines: use points if available
        const pts: number[][] = (entity as any).points;
        if (Array.isArray(pts) && pts.length > 1) {
          let sum = 0;
          for (let i = 0; i + 1 < pts.length; i++) {
            const [x1, y1] = to2D(pts[i]);
            const [x2, y2] = to2D(pts[i + 1]);
            sum += Math.hypot(x2 - x1, y2 - y1);
          }
          // if closed polyline, add last-to-first
          if ((entity as any).closed) {
            const [x1, y1] = to2D(pts[pts.length - 1]);
            const [x2, y2] = to2D(pts[0]);
            sum += Math.hypot(x2 - x1, y2 - y1);
          }
          return sum;
        }
        return 0;
      }
    }
  };

  // Compute lengths per layer and feature type (in drawing units)
  const lengthsByLayer = useMemo(() => {
    const result: { [layer: string]: { [featureType: string]: number } } = {};
    if (!dxfData) return result;
    for (const layerName of Object.keys(dxfData)) {
      const entities = dxfData[layerName] || [];
      const typeMap: { [featureType: string]: number } = {};
      for (const ent of entities) {
        const len = getEntityLength(ent);
        if (len <= 0) continue;
        typeMap[ent.type] = (typeMap[ent.type] || 0) + len;
      }
      result[layerName] = typeMap;
    }
    return result;
  }, [dxfData]);
  
  // Expand all feature types by default when data changes
  useEffect(() => {
    if (dxfData) {
      const newExpandedSet = new Set<string>();
      Object.entries(lengthsByLayer).forEach(([layer, typeMap]) => {
        Object.keys(typeMap).forEach(featureType => {
          newExpandedSet.add(`${layer}|${featureType}`);
        });
      });
      setExpandedFeatures(newExpandedSet);
    }
  }, [dxfData, lengthsByLayer]);

  // Total cost across all layers and features (in user units after conversion)
  const totalCost = useMemo(() => {
    let sum = 0;
    for (const layer in lengthsByLayer) {
      const typeMap = lengthsByLayer[layer];
      for (const featureType in typeMap) {
        const lengthUnits = typeMap[featureType];
        const lengthFt = lengthUnits * conversionFactor;
        const price = priceMap[layer]?.[featureType] || 0;
        sum += lengthFt * price;
      }
    }
    return sum;
  }, [lengthsByLayer, priceMap, conversionFactor]);
  
  // Export estimation data as CSV
  const exportCsv = () => {
    const rows: string[][] = [];
    rows.push(["Layer","Feature","Length_ft","Price_per_ft","Cost"]);
    for (const layer in lengthsByLayer) {
      const typeMap = lengthsByLayer[layer];
      for (const featureType in typeMap) {
        const lengthUnits = typeMap[featureType];
        const lengthFt = lengthUnits * conversionFactor;
        const price = priceMap[layer]?.[featureType] || 0;
        const cost = lengthFt * price;
        rows.push([
          layer,
          featureType,
          lengthFt.toFixed(2),
          price.toFixed(2),
          cost.toFixed(2),
        ]);
      }
    }
    rows.push(["","","","",""]);
    rows.push(["Total","","","", totalCost.toFixed(2)]);
    const csvContent = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'estimation.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle price input changes
  const handlePriceChange = (
    layer: string,
    featureType: string,
    value: string
  ) => {
    const price = parseFloat(value) || 0;
    setPriceMap(prev => ({
      ...prev,
      [layer]: {
        ...(prev[layer] || {}),
        [featureType]: price,
      },
    }));
  };

  // Toggle feature expansion
  const toggleFeatureExpansion = (layer: string, featureType: string) => {
    const key = `${layer}|${featureType}`;
    setExpandedFeatures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  if (!dxfData) {
    return <div className="text-gray-400">Load a DXF file to see estimator.</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold mb-6">Layer-Based Takeoff</h2>
      
      {Object.entries(lengthsByLayer).map(([layer, typeMap]) => {
        return (
          <div key={layer} className="mb-8 bg-white bg-opacity-5 rounded-lg overflow-hidden shadow-lg">
            <div className="bg-gray-700 bg-opacity-50 px-4 py-3">
              <h3 className="font-bold text-lg">{layer}</h3>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Feature types within this layer */}
              {Object.entries(typeMap).map(([featureType, length]) => {
                const lengthFt = length * conversionFactor;
                const pricePerFt = priceMap[layer]?.[featureType] || 0;
                const cost = lengthFt * pricePerFt;
                const featureKey = `${layer}|${featureType}`;
                const isExpanded = expandedFeatures.has(featureKey);
                
                return (
                  <div key={featureType} className="bg-gray-800 bg-opacity-30 rounded-md overflow-hidden">
                    {/* Feature header with type name and expand button */}
                    <div 
                      className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => toggleFeatureExpansion(layer, featureType)}
                    >
                      <div className="flex items-center space-x-2">
                        {isExpanded ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                        }
                        <span className="font-medium">{featureType}</span>
                      </div>
                      <div>
                        <span className="text-gray-300">{lengthFt.toFixed(2)} ft</span>
                      </div>
                    </div>
                    
                    {/* Expanded segment detail and pricing */}
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1">
                        {/* Individual segments */}
                        <div className="mb-3 max-h-40 overflow-y-auto">
                          <h5 className="text-sm font-medium mb-2 text-gray-300">Segments</h5>
                          <ul className="text-sm space-y-1 pl-5 list-disc">
                            {dxfData[layer].filter(ent => ent.type === featureType).map((ent, idx) => {
                              const lenUnits = getEntityLength(ent);
                              const lenFt = lenUnits * conversionFactor;
                              if (lenFt <= 0) return null;
                              return (
                                <li key={idx} className="text-gray-300">
                                  Segment {idx}: {lenFt.toFixed(2)} ft
                                </li>
                              );
                            }).filter(Boolean)}
                          </ul>
                        </div>
                        
                        {/* Pricing section */}
                        <div className="flex flex-col space-y-3 pt-2 border-t border-gray-600">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-300">Price per foot ($):</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-24 text-right rounded px-2 py-1 text-sm bg-gray-700 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                              value={pricePerFt}
                              onChange={e => handlePriceChange(layer, featureType, e.target.value)}
                            />
                          </div>
                          <div className="flex justify-between items-center bg-gray-700 bg-opacity-30 px-3 py-2 rounded-md">
                            <span className="font-medium">Total Cost:</span>
                            <span className="font-bold">${cost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {/* Total cost summary */}
      <div className="bg-gray-700 rounded-lg p-4 flex justify-between items-center shadow-lg">
        <span className="font-bold text-lg">Total Estimate:</span>
        <span className="font-bold text-xl">${totalCost.toFixed(2)}</span>
      </div>
      
      {/* Export CSV button */}
      <div className="flex justify-end">
        <button
          onClick={exportCsv}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors duration-200 shadow-md"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default EstimatorPanel;