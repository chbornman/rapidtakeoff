import React from 'react';

interface DragHandlerOptions {
  event: React.MouseEvent<SVGSVGElement>;
  dragStart: { x: number; y: number };
  currentOffset: { x: number; y: number };
}

interface DragHandlerResult {
  newOffset: { x: number; y: number };
  newDragStart: { x: number; y: number };
  hasMoved: boolean;
}

/**
 * Handle mouse drag interactions for canvas panning
 */
export function handleDrag({
  event,
  dragStart,
  currentOffset
}: DragHandlerOptions): DragHandlerResult {
  // Calculate distance moved
  const dx = event.clientX - dragStart.x;
  const dy = event.clientY - dragStart.y;
  
  // Check if we've moved enough to consider it a drag
  const hasMoved = Math.abs(dx) > 3 || Math.abs(dy) > 3;
  
  // Calculate new offset
  const newOffset = {
    x: currentOffset.x + dx,
    y: currentOffset.y + dy
  };
  
  // Update drag start point
  const newDragStart = { 
    x: event.clientX, 
    y: event.clientY 
  };
  
  return { 
    newOffset, 
    newDragStart, 
    hasMoved 
  };
}