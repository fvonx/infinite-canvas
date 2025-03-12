import React from 'react';
import { useCanvasContext } from '../../context/CanvasContext';

const StatusBar = () => {
  const { mode, transform } = useCanvasContext();

  // Convert mode to title case
  const formatMode = (mode) => {
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  return (
    <div className="status-bar">
      Mode: {formatMode(mode)} | 
      Zoom: {Math.round(transform.scale * 100)}% | 
      Position: {Math.round(transform.x)}, {Math.round(transform.y)} |
      Autosave: Enabled
    </div>
  );
};

export default StatusBar;