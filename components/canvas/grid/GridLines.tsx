import React from 'react';

interface GridLinesProps {
  scale: number;
  showGrid?: boolean;
}

/**
 * Component that renders the background grid for the canvas
 */
const GridLines: React.FC<GridLinesProps> = ({ scale, showGrid = true }) => {
  if (!showGrid) return null;
  
  return (
    <g className="grid-lines">
      {/* Create grid lines - scaled down by 10x for smaller DXF files */}
      {Array.from({ length: 300 }, (_, i) => i - 150).map(i => (
        <React.Fragment key={`grid-${i}`}>
          {/* Vertical grid lines (0.1 unit spacing) */}
          <line
            x1={i * 0.1}
            y1={-1000000}
            x2={i * 0.1}
            y2={1000000}
            stroke="#555555"
            strokeWidth={0.02 / scale}
            strokeDasharray={`${0.1 / scale},${0.3 / scale}`}
            opacity={0.3}
            fill="none"
          />
          {/* Horizontal grid lines (0.1 unit spacing) */}
          <line
            x1={-1000000}
            y1={i * 0.1}
            x2={1000000}
            y2={i * 0.1}
            stroke="#555555"
            strokeWidth={0.02 / scale}
            strokeDasharray={`${0.1 / scale},${0.3 / scale}`}
            opacity={0.3}
            fill="none"
          />
        </React.Fragment>
      ))}
      
      {/* Major grid lines (every 0.5 units) */}
      {Array.from({ length: 60 }, (_, i) => i - 30).map(i => (
        <React.Fragment key={`major-grid-${i}`}>
          {/* Vertical major grid lines */}
          <line
            x1={i * 0.5}
            y1={-1000000}
            x2={i * 0.5}
            y2={1000000}
            stroke="#666666"
            strokeWidth={0.05 / scale}
            strokeDasharray={`${0.2 / scale},${0.2 / scale}`}
            opacity={0.5}
            fill="none"
          />
          {/* Horizontal major grid lines */}
          <line
            x1={-1000000}
            y1={i * 0.5}
            x2={1000000}
            y2={i * 0.5}
            stroke="#666666"
            strokeWidth={0.05 / scale}
            strokeDasharray={`${0.2 / scale},${0.2 / scale}`}
            opacity={0.5}
            fill="none"
          />
        </React.Fragment>
      ))}
    </g>
  );
};

export default GridLines;