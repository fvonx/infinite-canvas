import { useCallback, useRef } from 'react';
import { 
  saveCanvasState, 
  exportCanvasState, 
  importCanvasState, 
  clearCanvasState 
} from '../utils/storageUtils';

/**
 * Custom hook to manage canvas storage operations
 */
const useStorage = (elements, setElements) => {
  const fileInputRef = useRef(null);
  
  // Save the current state to localStorage
  const saveState = useCallback(() => {
    try {
      const result = saveCanvasState(elements);
      return {
        success: result,
        message: result 
          ? 'Canvas state saved successfully!' 
          : 'Failed to save canvas state.'
      };
    } catch (error) {
      console.error('Error saving canvas state:', error);
      return {
        success: false,
        message: `Failed to save canvas state: ${error.message}`
      };
    }
  }, [elements]);
  
  // Export the current state to a file
  const exportState = useCallback(() => {
    try {
      const result = exportCanvasState(elements);
      return {
        success: result,
        message: result 
          ? 'Canvas state exported successfully!' 
          : 'Failed to export canvas state.'
      };
    } catch (error) {
      console.error('Error exporting canvas state:', error);
      return {
        success: false,
        message: `Failed to export canvas state: ${error.message}`
      };
    }
  }, [elements]);
  
  // Import state from JSON text
  const importState = useCallback((jsonText) => {
    try {
      const importedState = importCanvasState(jsonText);
      
      if (importedState) {
        // Apply the imported state through the setter function
        setElements(importedState);
        
        // Also save to localStorage
        saveCanvasState(importedState);
        
        return {
          success: true,
          message: 'Canvas state imported successfully!'
        };
      } else {
        return {
          success: false,
          message: 'Failed to import canvas state: Invalid format'
        };
      }
    } catch (error) {
      console.error('Error importing canvas state:', error);
      return {
        success: false,
        message: `Failed to import canvas state: ${error.message}`
      };
    }
  }, [setElements]);
  
  // Clear the saved state
  const clearState = useCallback(() => {
    try {
      const result = clearCanvasState();
      
      if (result) {
        // Also clear the current state through the setter function
        setElements({
          rectangles: [],
          postits: [],
          texts: [],
          connections: [],
          transform: { x: 0, y: 0, scale: 1 }
        });
        
        return {
          success: true,
          message: 'Canvas state cleared successfully!'
        };
      } else {
        return {
          success: false,
          message: 'Failed to clear canvas state.'
        };
      }
    } catch (error) {
      console.error('Error clearing canvas state:', error);
      return {
        success: false,
        message: `Failed to clear canvas state: ${error.message}`
      };
    }
  }, [setElements]);
  
  // Handle file upload for import
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return { success: false, message: 'No file selected' };
    
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onload = (e) => {
        const result = importState(e.target.result);
        resolve(result);
      };
      
      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Failed to read file'
        });
      };
      
      reader.readAsText(file);
    });
  }, [importState]);

  return {
    fileInputRef,
    saveState,
    exportState,
    importState,
    clearState,
    handleFileUpload
  };
};

export default useStorage;