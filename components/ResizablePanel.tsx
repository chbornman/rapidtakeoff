import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth: string;
  minWidth: string;
  maxWidth: string; 
  position: 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

export default function ResizablePanel({
  children,
  defaultWidth,
  minWidth,
  maxWidth,
  position,
  className = '',
  style = {},
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    resizingRef.current = true;
    startXRef.current = e.clientX;
    if (panelRef.current) {
      startWidthRef.current = panelRef.current.getBoundingClientRect().width;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    
    const deltaX = e.clientX - startXRef.current;
    const newWidth = position === 'left' 
      ? startWidthRef.current + deltaX 
      : startWidthRef.current - deltaX;
    
    // Convert string values to numbers for comparison
    const minWidthPx = parseInt(minWidth, 10);
    const maxWidthPx = parseInt(maxWidth, 10);
    
    if (newWidth >= minWidthPx && newWidth <= maxWidthPx) {
      setWidth(`${newWidth}px`);
    }
  }, [minWidth, maxWidth, position]);

  const handleMouseUp = useCallback(() => {
    resizingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={panelRef}
      className={`flex relative ${className}`}
      style={{ 
        width, 
        ...style 
      }}
    >
      {children}
      <div 
        className={`absolute cursor-col-resize w-1 h-full bg-transparent hover:bg-gray-400 hover:opacity-50 transition-colors duration-200 z-10 ${
          position === 'left' ? 'right-0 top-0' : 'left-0 top-0'
        }`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}