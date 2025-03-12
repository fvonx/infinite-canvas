import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook to manage canvas transformations (pan, zoom)
 */
const useTransform = () => {
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  
  const contentRef = useRef(null);
  
  // Apply transform to content whenever it changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
    }
  }, [transform]);
  
  // Pan the canvas
  const panCanvas = useCallback((dx, dy) => {
    setTransform(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));
  }, []);
  
  // Zoom in
  const zoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 5)
    }));
  }, []);
  
  // Zoom out
  const zoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.1)
    }));
  }, []);
  
  // Reset zoom and position
  const resetZoom = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);
  
  // Convert screen coordinates to canvas coordinates
  const screenToCanvasCoords = useCallback((screenX, screenY, canvasRect) => {
    return {
      x: (screenX - canvasRect.left - transform.x) / transform.scale,
      y: (screenY - canvasRect.top - transform.y) / transform.scale
    };
  }, [transform]);
  
  return {
    transform,
    setTransform,
    contentRef,
    panCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
    screenToCanvasCoords
  };
};

export default useTransform;