import React from 'react';

// Create the Canvas Context with an empty default value
const CanvasContext = React.createContext(null);

// Custom hook to use the Canvas Context
export const useCanvasContext = () => {
  const context = React.useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
};

export default CanvasContext;