import React from 'react';
import { useCanvasContext } from '../../context/CanvasContext';
import { 
  saveCanvasState, 
  exportCanvasState, 
  importCanvasState, 
  clearCanvasState 
} from '../../utils/storageUtils';

const StorageControls = () => {
  const { 
    fileInputRef,
    rectangles, 
    postits, 
    texts, 
    connections, 
    transform,
    setRectangles,
    setPostits,
    setTexts,
    setConnections,
    setTransform
  } = useCanvasContext();

  // Handle manual save
  const handleSave = () => {
    try {
      const stateToSave = {
        rectangles,
        postits,
        texts,
        connections,
        transform
      };
      
      if (saveCanvasState(stateToSave)) {
        alert('Canvas state saved successfully!');
      } else {
        alert('Failed to save canvas state.');
      }
    } catch (error) {
      console.error('Error manually saving canvas state:', error);
      alert('Failed to save canvas state: ' + error.message);
    }
  };

  // Handle export
  const handleExport = () => {
    try {
      const stateToExport = {
        rectangles,
        postits,
        texts,
        connections,
        transform
      };
      
      if (exportCanvasState(stateToExport)) {
        alert('Canvas state exported successfully!');
      } else {
        alert('Failed to export canvas state.');
      }
    } catch (error) {
      console.error('Error exporting canvas state:', error);
      alert('Failed to export canvas state: ' + error.message);
    }
  };

  // Handle import
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const importedState = importCanvasState(e.target.result);
        
        if (importedState) {
          // Apply the imported state
          setRectangles(importedState.rectangles || []);
          setPostits(importedState.postits || []);
          setTexts(importedState.texts || []);
          setConnections(importedState.connections || []);
          setTransform(importedState.transform || { x: 0, y: 0, scale: 1 });
          
          // Also save to localStorage
          saveCanvasState(importedState);
          
          alert('Canvas state imported successfully!');
        } else {
          alert('Failed to import canvas state: Invalid format');
        }
      } catch (error) {
        console.error('Error importing canvas state:', error);
        alert('Failed to import canvas state: ' + error.message);
      }
    };
    
    reader.onerror = () => {
      alert('Failed to read file');
    };
    
    reader.readAsText(file);
    
    // Reset the file input so the same file can be selected again
    event.target.value = null;
  };

  // Handle clear
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the saved canvas state? This will remove all elements from storage.')) {
      try {
        if (clearCanvasState()) {
          setRectangles([]);
          setPostits([]);
          setTexts([]);
          setConnections([]);
          setTransform({ x: 0, y: 0, scale: 1 });
          alert('Canvas state cleared successfully!');
        } else {
          alert('Failed to clear canvas state.');
        }
      } catch (error) {
        console.error('Error clearing canvas state:', error);
        alert('Failed to clear canvas state: ' + error.message);
      }
    }
  };

  return (
    <div className="storage-controls">
      {/* Hidden file input for importing canvas state */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".json"
        onChange={handleImport}
      />
      
      <button onClick={handleSave} title="Save the current state to localStorage">
        Save
      </button>
      <button onClick={handleExport} title="Export the canvas state to a file">
        Export
      </button>
      <button onClick={() => fileInputRef.current.click()} title="Import canvas state from a file">
        Import
      </button>
      <button onClick={handleClear} title="Clear the saved state and reset the canvas">
        Reset
      </button>
    </div>
  );
};

export default StorageControls;