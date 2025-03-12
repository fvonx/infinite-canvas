/**
 * Calculate connection points between two elements
 * @param {Object} fromElement - The source element
 * @param {Object} toElement - The target element
 * @returns {Object} Object with x,y coordinates for start and end points
 */
export const getConnectionPoints = (fromElement, toElement) => {
  const fromX = fromElement.x + fromElement.width / 2;
  const fromY = fromElement.y + fromElement.height / 2;
  const toX = toElement.x + toElement.width / 2;
  const toY = toElement.y + toElement.height / 2;
  
  return { fromX, fromY, toX, toY };
};

/**
 * Find element by ID and type in the given collections
 * @param {string} id - Element ID
 * @param {string} type - Element type ('rectangle', 'postit', or 'text')
 * @param {Object} collections - Object containing all element collections
 * @returns {Object|null} The found element or null
 */
export const findElementById = (id, type, collections) => {
  const { rectangles, postits, texts } = collections;
  
  switch (type) {
    case 'rectangle':
      return rectangles.find(r => r.id === id) || null;
    case 'postit':
      return postits.find(p => p.id === id) || null;
    case 'text':
      return texts.find(t => t.id === id) || null;
    default:
      return null;
  }
};

/**
 * Find target element at the given coordinates
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Object} collections - Object containing all element collections
 * @param {string} excludeId - ID to exclude from search (optional)
 * @param {string} excludeType - Type to exclude from search (optional)
 * @returns {Object|null} Object with found element and its type, or null
 */
export const findElementAtCoordinates = (x, y, collections, excludeId, excludeType) => {
  const { rectangles, postits, texts } = collections;
  
  // Check rectangles
  const targetRect = rectangles.find(r => 
    x >= r.x && 
    x <= r.x + r.width && 
    y >= r.y && 
    y <= r.y + r.height &&
    !(r.id === excludeId && excludeType === 'rectangle')
  );
  
  if (targetRect) {
    return { element: targetRect, type: 'rectangle' };
  }
  
  // Check post-its
  const targetPostit = postits.find(p => 
    x >= p.x && 
    x <= p.x + p.width && 
    y >= p.y && 
    y <= p.y + p.height &&
    !(p.id === excludeId && excludeType === 'postit')
  );
  
  if (targetPostit) {
    return { element: targetPostit, type: 'postit' };
  }
  
  // Check text nodes
  const targetText = texts.find(t => 
    x >= t.x && 
    x <= t.x + t.width && 
    y >= t.y && 
    y <= t.y + t.height &&
    !(t.id === excludeId && excludeType === 'text')
  );
  
  if (targetText) {
    return { element: targetText, type: 'text' };
  }
  
  return null;
};

/**
 * Create a connection path string for SVG
 * @param {Object} fromPoint - Start point {x, y}
 * @param {Object} toPoint - End point {x, y}
 * @returns {string} SVG path string
 */
export const createConnectionPath = (fromPoint, toPoint) => {
  const { fromX, fromY, toX, toY } = getConnectionPoints(
    { x: fromPoint.x, y: fromPoint.y, width: 0, height: 0 },
    { x: toPoint.x, y: toPoint.y, width: 0, height: 0 }
  );
  
  return `M${fromX},${fromY} C${fromX + (toX - fromX) / 2},${fromY} ${toX - (toX - fromX) / 2},${toY} ${toX},${toY}`;
};