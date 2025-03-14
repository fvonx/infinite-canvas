/**
 * Get the center point of an element
 * @param {Object} element - The element (rectangle, postit, or text)
 * @returns {Object} Center coordinates {x, y}
 */
export const getElementCenter = (element) => {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  return { x: centerX, y: centerY };
};

/**
 * Calculate the four edge midpoints of an element
 * @param {Object} element - The element (rectangle, postit, or text)
 * @returns {Object} Object with top, right, bottom, left midpoints
 */
export const getEdgeMidpoints = (element) => {
  const { x, y, width, height } = element;
  
  return {
    top: { x: x + width / 2, y: y },
    right: { x: x + width, y: y + height / 2 },
    bottom: { x: x + width / 2, y: y + height },
    left: { x: x, y: y + height / 2 }
  };
};

/**
 * Find the distance between two points
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @returns {number} Distance
 */
export const getDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + 
    Math.pow(point2.y - point1.y, 2)
  );
};

/**
 * Find the best sides to connect two elements
 * @param {Object} fromElement - Source element
 * @param {Object} toElement - Target element
 * @returns {Object} Best sides {fromSide, toSide}
 */
export const findBestConnectionSides = (fromElement, toElement) => {
  // Get center points
  const fromCenter = getElementCenter(fromElement);
  const toCenter = getElementCenter(toElement);
  
  // Determine dominant axis (is the connection more horizontal or vertical?)
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const isHorizontalDominant = Math.abs(dx) > Math.abs(dy);
  
  let fromSide, toSide;
  
  if (isHorizontalDominant) {
    // Horizontal connection
    if (dx > 0) {
      // To element is to the right of from element
      fromSide = 'right';
      toSide = 'left';
    } else {
      // To element is to the left of from element
      fromSide = 'left';
      toSide = 'right';
    }
  } else {
    // Vertical connection
    if (dy > 0) {
      // To element is below from element
      fromSide = 'bottom';
      toSide = 'top';
    } else {
      // To element is above from element
      fromSide = 'top';
      toSide = 'bottom';
    }
  }
  
  return { fromSide, toSide };
};

/**
 * Find the nearest edge point from one element to another
 * @param {Object} fromElement - Source element
 * @param {Object} toElement - Target element
 * @param {string} [preferredFromSide] - Preferred source side
 * @param {string} [preferredToSide] - Preferred target side
 * @returns {Object} Connection points {fromX, fromY, toX, toY, fromSide, toSide}
 */
export const getConnectionPoints = (fromElement, toElement, preferredFromSide, preferredToSide) => {
  // Get edge midpoints for both elements
  const fromEdges = getEdgeMidpoints(fromElement);
  const toEdges = getEdgeMidpoints(toElement);
  
  let fromSide, toSide;
  
  // If preferred sides are specified, use them
  if (preferredFromSide && preferredToSide) {
    fromSide = preferredFromSide;
    toSide = preferredToSide;
  } else {
    // Otherwise find the best sides
    const bestSides = findBestConnectionSides(fromElement, toElement);
    fromSide = bestSides.fromSide;
    toSide = bestSides.toSide;
  }
  
  // Get the points for the chosen sides
  const fromPoint = fromEdges[fromSide];
  const toPoint = toEdges[toSide];
  
  // Return the connection points
  return {
    fromX: fromPoint.x,
    fromY: fromPoint.y,
    toX: toPoint.x,
    toY: toPoint.y,
    fromSide,
    toSide
  };
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
 * Calculate control points for curved path based on connection sides
 * @param {Object} connectionPoints - Connection points from getConnectionPoints
 * @returns {Object} Control points for the path
 */
export const calculateControlPoints = (connectionPoints) => {
  const { fromX, fromY, toX, toY, fromSide, toSide } = connectionPoints;
  
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Base curve factor on distance between points (longer = more curved)
  const baseCurveFactor = Math.min(distance * 0.2, 100); // Cap at 100px
  const curveFactor = Math.max(baseCurveFactor, 30); // Minimum of 30px curve
  
  // Default control points for a smooth curve
  let cp1x = fromX;
  let cp1y = fromY;
  let cp2x = toX;
  let cp2y = toY;
  
  // Adjust control points based on which sides are connected
  if (fromSide === 'top') {
    cp1y = fromY - curveFactor;
  } else if (fromSide === 'right') {
    cp1x = fromX + curveFactor;
  } else if (fromSide === 'bottom') {
    cp1y = fromY + curveFactor;
  } else if (fromSide === 'left') {
    cp1x = fromX - curveFactor;
  }
  
  if (toSide === 'top') {
    cp2y = toY - curveFactor;
  } else if (toSide === 'right') {
    cp2x = toX + curveFactor;
  } else if (toSide === 'bottom') {
    cp2y = toY + curveFactor;
  } else if (toSide === 'left') {
    cp2x = toX - curveFactor;
  }
  
  return { cp1x, cp1y, cp2x, cp2y };
};

/**
 * Create a connection path string for SVG
 * @param {Object} connectionPoints - All connection points and sides
 * @returns {string} SVG path string
 */
export const createConnectionPath = (connectionPoints) => {
  const { fromX, fromY, toX, toY } = connectionPoints;
  const { cp1x, cp1y, cp2x, cp2y } = calculateControlPoints(connectionPoints);
  
  return `M${fromX},${fromY} C${cp1x},${cp1y} ${cp2x},${cp2y} ${toX},${toY}`;
};