import React, { useState, useEffect, useRef, useCallback } from 'react';
import CanvasContext from './CanvasContext';
import { loadCanvasState, saveCanvasState } from '../utils/storageUtils';

const CanvasProvider = ({ children }) => {
  // State for the canvas elements
  const [rectangles, setRectangles] = useState([]);
  const [postits, setPostits] = useState([]);
  const [texts, setTexts] = useState([]);
  const [connections, setConnections] = useState([]);
  
  // State for selection and mode
  const [mode, setMode] = useState('select');
  const [selectedRectId, setSelectedRectId] = useState(null);
  const [selectedPostitId, setSelectedPostitId] = useState(null);
  const [selectedTextId, setSelectedTextId] = useState(null);
  
  // State for multi-selection
  const [selectedElements, setSelectedElements] = useState({
    rectangles: [],   // Array of selected rectangle IDs
    postits: [],      // Array of selected post-it IDs
    texts: [],        // Array of selected text IDs
    connections: []   // Array of selected connection IDs
  });
  
  // State for connection creation
  const [startConnection, setStartConnection] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  const [connectionSource, setConnectionSource] = useState(null);
  
  // Refs
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Transform state
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  
  // Load saved state on initial render
  useEffect(() => {
    try {
      const savedState = loadCanvasState();
      if (savedState) {
        const { rectangles, postits, texts, connections: savedConnections, transform } = savedState;
        
        setRectangles(rectangles || []);
        setPostits(postits || []);
        setTexts(texts || []);
        setConnections(savedConnections || []);
        setTransform(transform || { x: 0, y: 0, scale: 1 });
        
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
          rectangles,
          postits,
          texts,
          connections,
          transform
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
    rectangles, 
    postits, 
    texts, 
    connections, 
    transform
  ]);
  
  // Apply transform to content
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
    }
  }, [transform]);
  
  // Clear all selections (both individual and multi-selection)
  const clearAllSelections = useCallback(() => {
    setSelectedRectId(null);
    setSelectedPostitId(null);
    setSelectedTextId(null);
    setSelectedElements({
      rectangles: [],
      postits: [],
      texts: [],
      connections: []
    });
  }, []);
  
  // Clear connection
  const clearConnection = useCallback(() => {
    setStartConnection(null);
    setTempConnection(null);
    setConnectionSource(null);
  }, []);
  
  // Set mode with side effects
  const setModeWithEffects = useCallback((newMode) => {
    setMode(newMode);
    if (newMode !== 'connect') {
      clearConnection();
    }
  }, [clearConnection]);
  
  // Zoom functions
  const zoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 5)
    }));
  }, []);
  
  const zoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.1)
    }));
  }, []);
  
  const resetZoom = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);
  
  // Provide all state and functions to children components
  const contextValue = {
    // State
    mode,
    rectangles,
    postits,
    texts,
    connections,
    selectedRectId,
    selectedPostitId,
    selectedTextId,
    startConnection,
    tempConnection,
    connectionSource,
    transform,
    selectedElements,
    
    // Refs
    canvasRef,
    contentRef,
    fileInputRef,
    
    // State setters
    setMode: setModeWithEffects,
    setRectangles,
    setPostits,
    setTexts,
    setConnections,
    setSelectedRectId,
    setSelectedPostitId,
    setSelectedTextId,
    setStartConnection,
    setTempConnection,
    setConnectionSource,
    setTransform,
    setSelectedElements,
    
    // Actions
    clearAllSelections,
    clearConnection,
    zoomIn,
    zoomOut,
    resetZoom,
  };
  
  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
};

export default CanvasProvider;