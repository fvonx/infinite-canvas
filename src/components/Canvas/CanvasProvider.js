import React, { useState, useEffect, useRef, useCallback } from 'react';
import CanvasContext from './CanvasContext';
import useElements from '../hooks/useElements';
import useConnections from '../hooks/useConnections';
import useTransform from '../hooks/useTransform';
import { loadCanvasState, saveCanvasState } from '../utils/storageUtils';

const CanvasProvider = ({ children }) => {
  // State for canvas mode and selection
  const [mode, setMode] = useState('select');
  const [selectedRectId, setSelectedRectId] = useState(null);
  const [selectedPostitId, setSelectedPostitId] = useState(null);
  const [selectedTextId, setSelectedTextId] = useState(null);
  
  // Custom hooks
  const elements = useElements();
  const connections = useConnections();
  const transformControls = useTransform();
  
  // Refs
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Load saved state on initial render
  useEffect(() => {
    try {
      const savedState = loadCanvasState();
      if (savedState) {
        const { rectangles, postits, texts, connections: savedConnections, transform } = savedState;
        
        elements.setRectangles(rectangles || []);
        elements.setPostits(postits || []);
        elements.setTexts(texts || []);
        connections.setConnections(savedConnections || []);
        transformControls.setTransform(transform || { x: 0, y: 0, scale: 1 });
        
        console.log('Canvas state loaded from localStorage');
      }
    } catch (error) {
      console.error('Error loading canvas state:', error);
    }
  }, []);
  
  // Autosave state whenever it changes
  useEffect(() => {
    const saveState = () => {
      try {
        const stateToSave = {
          rectangles: elements.rectangles,
          postits: elements.postits,
          texts: elements.texts,
          connections: connections.connections,
          transform: transformControls.transform
        };
        
        saveCanvasState(stateToSave);
        console.log('Canvas state autosaved to localStorage');
      } catch (error) {
        console.error('Error saving canvas state:', error);
      }
    };
    
    // Debounce the save operation to avoid too frequent saves
    const timeoutId = setTimeout(saveState, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [
    elements.rectangles, 
    elements.postits, 
    elements.texts, 
    connections.connections, 
    transformControls.transform
  ]);
  
  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedRectId(null);
    setSelectedPostitId(null);
    setSelectedTextId(null);
  }, []);
  
  // Set mode with side effects
  const setModeWithEffects = useCallback((newMode) => {
    setMode(newMode);
    if (newMode !== 'connect') {
      connections.cancelConnection();
    }
  }, [connections]);
  
  // Provide all state and functions to children components
  const contextValue = {
    // Mode and selection state
    mode,
    setMode: setModeWithEffects,
    selectedRectId,
    setSelectedRectId,
    selectedPostitId,
    setSelectedPostitId,
    selectedTextId,
    setSelectedTextId,
    clearSelection,
    
    // Refs
    canvasRef,
    contentRef: transformControls.contentRef,
    fileInputRef,
    
    // Elements from useElements
    ...elements,
    
    // Connections from useConnections
    ...connections,
    
    // Transform controls from useTransform
    ...transformControls
  };
  
  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
};

export default CanvasProvider;