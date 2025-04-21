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
      {/* X Axis (horizontal) - simple line */}
      <line
        x1={-INFINITE_EXTENT}
        y1={0}
        x2={INFINITE_EXTENT}
        y2={0}
        stroke={xAxisColor}
        strokeWidth={strokeWidth * 1.0}
      />
      
      {/* Y Axis (vertical) - simple line */}
      <line
        x1={0}
        y1={-INFINITE_EXTENT}
        x2={0}
        y2={INFINITE_EXTENT}
        stroke={yAxisColor}
        strokeWidth={strokeWidth * 1.0}
      />
      
      {/* Simple origin marker */}
      <circle
        cx={0}
        cy={0}
        r={0.05/strokeWidth}
        fill="#ffffff"
        stroke="#000000"
        strokeWidth={0.01/strokeWidth}
      />
    </>
  );
};

export default React.memo(OriginAxes);