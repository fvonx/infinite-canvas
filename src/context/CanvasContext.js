import React from 'react';

// Create the Canvas Context with default values including clipboard functions
const CanvasContext = React.createContext({
  // Default state values
  mode: 'select',
  rectangles: [],
  postits: [],
  texts: [],
  connections: [],
  selectedRectId: null,
  selectedPostitId: null,
  selectedTextId: null,
  startConnection: null,
  tempConnection: null,
  connectionSource: null,
  transform: { x: 0, y: 0, scale: 1 },
  selectedElements: { rectangles: [], postits: [], texts: [], connections: [] },
  clipboardItems: { rectangles: [], postits: [], texts: [] },
  
  // Ref placeholders
  canvasRef: null,
  contentRef: null,
  fileInputRef: null,
  
  // Functions placeholders
  setMode: () => {},
  setRectangles: () => {},
  setPostits: () => {},
  setTexts: () => {},
  setConnections: () => {},
  setSelectedRectId: () => {},
  setSelectedPostitId: () => {},
  setSelectedTextId: () => {},
  setStartConnection: () => {},
  setTempConnection: () => {},
  setConnectionSource: () => {},
  setTransform: () => {},
  setSelectedElements: () => {},
  setClipboardItems: () => {},
  clearAllSelections: () => {},
  clearConnection: () => {},
  zoomIn: () => {},
  zoomOut: () => {},
  resetZoom: () => {},
  copySelectedElements: () => {},
  pasteElements: () => {},
});

// Custom hook to use the Canvas Context
export const useCanvasContext = () => {
  const context = React.useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
};

export default CanvasContext;