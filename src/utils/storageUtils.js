/**
 * Load canvas state from localStorage
 * @returns {Object|null} The loaded canvas state or null if not found
 */
export const loadCanvasState = () => {
  try {
    const savedState = localStorage.getItem('canvasState');
    if (savedState) {
      return JSON.parse(savedState);
    }
    return null;
  } catch (error) {
    console.error('Error loading canvas state:', error);
    return null;
  }
};

/**
 * Save canvas state to localStorage
 * @param {Object} state - The canvas state to save
 */
export const saveCanvasState = (state) => {
  try {
    localStorage.setItem('canvasState', JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Error saving canvas state:', error);
    return false;
  }
};

/**
 * Export canvas state to a file
 * @param {Object} state - The canvas state to export
 */
export const exportCanvasState = (state) => {
  try {
    const stateToExport = {
      ...state,
      exportDate: new Date().toISOString()
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(stateToExport, null, 2);
    
    // Create a blob with the data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-state-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting canvas state:', error);
    return false;
  }
};

/**
 * Import canvas state from JSON text
 * @param {string} jsonText - The JSON text to import
 * @returns {Object|null} The imported state or null if invalid
 */
export const importCanvasState = (jsonText) => {
  try {
    const importedState = JSON.parse(jsonText);
    
    // Validate the imported state
    if (!importedState.rectangles || !importedState.postits || !importedState.connections) {
      throw new Error('Invalid canvas state file');
    }
    
    return importedState;
  } catch (error) {
    console.error('Error importing canvas state:', error);
    return null;
  }
};

/**
 * Clear canvas state from localStorage
 */
export const clearCanvasState = () => {
  try {
    localStorage.removeItem('canvasState');
    return true;
  } catch (error) {
    console.error('Error clearing canvas state:', error);
    return false;
  }
};