/**
 * Utility functions for clipboard operations (copy/paste)
 */

/**
 * Create copies of elements with new IDs at offset positions
 * @param {Array} elements - Original elements to copy
 * @param {number} offsetX - X offset for pasted elements
 * @param {number} offsetY - Y offset for pasted elements
 * @returns {Array} Array of new elements with updated IDs and positions
 */
export const createElementCopies = (elements, offsetX = 20, offsetY = 20) => {
  return elements.map(element => {
    // Generate a unique ID based on timestamp plus random number
    const newId = Date.now() + Math.floor(Math.random() * 10000);
    
    return {
      ...element,
      id: newId,
      x: element.x + offsetX,
      y: element.y + offsetY
    };
  });
};

/**
 * Generate an ID for clipboard operations
 * @returns {number} A unique ID
 */
export const generateClipboardId = () => {
  return Date.now() + Math.floor(Math.random() * 10000);
};

/**
 * Gets elements that are currently selected
 * @param {Object} params - Object containing current state
 * @param {Array} params.elements - All elements of a particular type
 * @param {Array} params.selectedIds - Array of selected IDs from multi-selection
 * @param {string|null} params.selectedId - Single selected element ID
 * @returns {Array} Array of selected elements
 */
export const getSelectedElements = ({ elements, selectedIds, selectedId }) => {
  return elements.filter(element => 
    selectedIds.includes(element.id) || element.id === selectedId
  );
};