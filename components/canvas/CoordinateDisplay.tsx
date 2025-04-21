import React from 'react';

interface CoordinateDisplayProps {
  x: number;
  y: number;
}

/**
 * Component to display current mouse coordinates on the canvas
 */
const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({ x, y }) => {
  return (
    <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-md font-mono text-sm z-10">
      X: {x.toFixed(4)} Y: {y.toFixed(4)}
    </div>
  );
};

export default CoordinateDisplay;