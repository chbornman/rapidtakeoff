import React from 'react';

interface OriginAxesProps {
  halfWidth: number;
  halfHeight: number;
  xAxisColor?: string;
  yAxisColor?: string;
  strokeWidth?: number;
}

/**
 * Component to render the origin axes (X and Y) as "infinite" lines that extend far beyond the visible area
 */
const OriginAxes: React.FC<OriginAxesProps> = ({
  halfWidth,
  halfHeight,
  xAxisColor = '#ff5555',  // Brighter red for dark background
  yAxisColor = '#55ff55',  // Brighter green for dark background
  strokeWidth = 1,
}) => {
  // Use a much larger extent for the axes to appear infinite
  // This should be large enough that the user can't easily pan beyond the ends
  const INFINITE_EXTENT = 10000; // 10,000 units should appear infinite for small DXF files
  
  // Scale axis elements appropriately relative to the canvas
  const axisScale = Math.min(1, halfWidth / 150); // Better scale for visibility
  
  return (
    <>
      {/* X Axis (horizontal) */}
      <line
        x1={-INFINITE_EXTENT}
        y1={0}
        x2={INFINITE_EXTENT}
        y2={0}
        stroke={xAxisColor}
        strokeWidth={strokeWidth * 1.5}
      />
      
      {/* Add tick marks along X axis (scaled down by 10x) */}
      {[-5, -4.5, -4, -3.5, -3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(tick => (
        <line
          key={`x-tick-${tick}`}
          x1={tick}
          y1={-0.1/strokeWidth}
          x2={tick}
          y2={0.1/strokeWidth}
          stroke={xAxisColor}
          strokeWidth={strokeWidth}
        />
      ))}
      
      {/* X axis arrow */}
      <polygon 
        points={`${5 + 0.3/strokeWidth},0 ${5},${-0.15/strokeWidth} ${5},${0.15/strokeWidth}`} 
        fill={xAxisColor}
      />
      
      {/* X axis label */}
      <text 
        x={5 + 0.3/strokeWidth} 
        y={0.1/strokeWidth} 
        fill={xAxisColor} 
        fontSize={0.2/strokeWidth} 
        style={{ transform: `scale(${strokeWidth}, ${strokeWidth})` }}
      >
        X
      </text>
      
      {/* Y Axis (vertical) */}
      <line
        x1={0}
        y1={-INFINITE_EXTENT}
        x2={0}
        y2={INFINITE_EXTENT}
        stroke={yAxisColor}
        strokeWidth={strokeWidth * 1.5}
      />
      
      {/* Add tick marks along Y axis (scaled down by 10x) */}
      {[-5, -4.5, -4, -3.5, -3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(tick => (
        <line
          key={`y-tick-${tick}`}
          x1={-0.1/strokeWidth}
          y1={tick}
          x2={0.1/strokeWidth}
          y2={tick}
          stroke={yAxisColor}
          strokeWidth={strokeWidth}
        />
      ))}
      
      {/* Y axis arrow (pointing up with the standard coordinate system) */}
      <polygon 
        points={`0,${5 + 0.3/strokeWidth} ${-0.15/strokeWidth},${5} ${0.15/strokeWidth},${5}`} 
        fill={yAxisColor}
      />
      
      {/* Y axis label */}
      <text 
        x={0.1/strokeWidth} 
        y={5 + 0.3/strokeWidth} 
        fill={yAxisColor} 
        fontSize={0.2/strokeWidth}
        style={{ transform: `scale(${strokeWidth}, ${strokeWidth})` }}
      >
        Y
      </text>
      
      {/* Origin marker */}
      <circle
        cx={0}
        cy={0}
        r={0.1/strokeWidth}
        fill="#ffffff"
        stroke="#000000"
        strokeWidth={0.02/strokeWidth}
      />
    </>
  );
};

export default React.memo(OriginAxes);