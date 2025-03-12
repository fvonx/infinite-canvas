import React from 'react';
import { useCanvasContext } from '../../context/CanvasContext';

const ZoomControls = () => {
  const { zoomIn, zoomOut, resetZoom } = useCanvasContext();

  return (
    <div className="zoom-controls">
      <button onClick={zoomIn} title="Zoom in">+</button>
      <button onClick={resetZoom} title="Reset zoom">Reset</button>
      <button onClick={zoomOut} title="Zoom out">-</button>
    </div>
  );
};

export default ZoomControls;