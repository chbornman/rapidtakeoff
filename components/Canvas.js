import React, { useState, useEffect, useRef } from 'react';

/**
 * Simple SVG Canvas to render parsed DXF geometry.
 * Props:
 *  - data: Array of geometry objects ({type, ...})
 */
export default function Canvas({ data }) {
  if (!data || data.length === 0) {
    return null;
  }
  // Collect coordinate extents
  const xs = [];
  const ys = [];
  data.forEach(item => {
    switch (item.type) {
      case 'line':
        xs.push(item.x1, item.x2);
        ys.push(item.y1, item.y2);
        break;
      case 'circle':
      case 'arc':
        xs.push(item.cx - item.r, item.cx + item.r);
        ys.push(item.cy - item.r, item.cy + item.r);
        break;
      default:
        break;
    }
  });
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;
  const margin = Math.max(width, height) * 0.05;
  // Initial viewBox [x, y, w, h], invert Y axis
  const initialViewBox = [
    minX - margin,
    -(maxY + margin),
    width + margin * 2,
    height + margin * 2,
  ];
  const [viewBox, setViewBox] = useState(initialViewBox);
  // Reset when data changes
  useEffect(() => {
    setViewBox(initialViewBox);
  }, [initialViewBox.join()]);
  const svgRef = useRef(null);
  // Panning state
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ x0: 0, y0: 0, vb0: initialViewBox, rect: null });
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    panStart.current = { x0: e.clientX, y0: e.clientY, vb0: viewBox.slice(), rect };
    setPanning(true);
  };
  const onMouseMove = (e) => {
    if (!panning) return;
    const { x0, y0, vb0, rect } = panStart.current;
    const dx = ((e.clientX - x0) * vb0[2]) / rect.width;
    const dy = ((e.clientY - y0) * vb0[3]) / rect.height;
    setViewBox([vb0[0] - dx, vb0[1] - dy, vb0[2], vb0[3]]);
  };
  const onMouseUp = () => panning && setPanning(false);
  // Zoom controls
  const zoomBy = (factor) => {
    const [x, y, w, h] = viewBox;
    const newW = w / factor;
    const newH = h / factor;
    const dx = (w - newW) / 2;
    const dy = (h - newH) / 2;
    setViewBox([x + dx, y + dy, newW, newH]);
  };
  const zoomIn = () => zoomBy(1.2);
  const zoomOut = () => zoomBy(1 / 1.2);
  const resetView = () => setViewBox(initialViewBox);
  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className={panning ? 'w-full h-full cursor-grabbing' : 'w-full h-full cursor-grab'}
        viewBox={viewBox.join(' ')}
        xmlns="http://www.w3.org/2000/svg"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {data.map((item, idx) => {
        switch (item.type) {
          case 'line':
            return (
              <line
                key={idx}
                x1={item.x1}
                y1={-item.y1}
                x2={item.x2}
                y2={-item.y2}
                stroke="black"
                strokeWidth="0.5"
              />
            );
          case 'circle':
            return (
              <circle
                key={idx}
                cx={item.cx}
                cy={-item.cy}
                r={item.r}
                fill="none"
                stroke="black"
                strokeWidth="0.5"
              />
            );
          case 'arc': {
            const { cx, cy, r, start_angle, end_angle } = item;
            const rad = Math.PI / 180;
            const x1 = cx + r * Math.cos(start_angle * rad);
            const y1 = cy + r * Math.sin(start_angle * rad);
            const x2 = cx + r * Math.cos(end_angle * rad);
            const y2 = cy + r * Math.sin(end_angle * rad);
            const largeArcFlag = ((end_angle - start_angle) % 360 + 360) % 360 > 180 ? 1 : 0;
            const d = `M ${x1} ${-y1} A ${r} ${r} 0 ${largeArcFlag} 0 ${x2} ${-y2}`;
            return <path key={idx} d={d} fill="none" stroke="black" strokeWidth="0.5" />;
          }
          default:
            return null;
        }
      })}
    </svg>
    {/* Controls: zoom in, zoom out, reset */}
    <div className="absolute top-2 right-2 flex space-x-2 bg-white bg-opacity-75 p-1 rounded">
      <button onClick={zoomIn} className="p-1 hover:bg-gray-200 rounded">
        <span className="text-lg font-bold">+</span>
      </button>
      <button onClick={zoomOut} className="p-1 hover:bg-gray-200 rounded">
        <span className="text-lg font-bold">−</span>
      </button>
      <button onClick={resetView} className="p-1 hover:bg-gray-200 rounded">
        <span className="text-lg">⟳</span>
      </button>
    </div>
  </div>
  );
}