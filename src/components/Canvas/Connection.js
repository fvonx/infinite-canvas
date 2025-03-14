import React from 'react';
import { useCanvasContext } from '../../context/CanvasContext';
import { 
  findElementById, 
  getConnectionPoints, 
  createConnectionPath 
} from '../../utils/connectionUtils';

const Connection = ({ connection, temporary = false, isMultiSelected = false }) => {
  const { 
    mode, 
    rectangles, 
    postits, 
    texts, 
    connections, 
    setConnections,
    selectedElements,
    setSelectedElements,
    clearAllSelections
  } = useCanvasContext();

  // Handle connection click
  const handleClick = (e) => {
    e.stopPropagation();
    
    if (mode === 'delete' && !temporary) {
      // Delete the connection
      setConnections(connections.filter(conn => conn.id !== connection.id));
      
      // Remove from multi-selection if needed
      if (isMultiSelected) {
        setSelectedElements(prev => ({
          ...prev,
          connections: prev.connections.filter(id => id !== connection.id)
        }));
      }
    } else if (mode === 'select' && !temporary) {
      // Select or multi-select the connection
      if (e.shiftKey) {
        // Shift+click for toggling selection
        if (isMultiSelected) {
          // If already in multi-selection, remove it
          setSelectedElements(prev => ({
            ...prev,
            connections: prev.connections.filter(id => id !== connection.id)
          }));
        } else {
          // Add to multi-selection - preserve other selections
          setSelectedElements(prev => ({
            ...prev,
            connections: [...prev.connections, connection.id]
          }));
        }
      } else {
        // Regular click - select only this connection
        clearAllSelections();
        setSelectedElements({
          rectangles: [],
          postits: [],
          texts: [],
          connections: [connection.id]
        });
      }
    }
  };

  // Find source and target elements to calculate connection points
  const collections = { rectangles, postits, texts };
  
  // For regular connections
  if (!temporary) {
    const fromElement = findElementById(
      connection.from, 
      connection.sourceType, 
      collections
    );
    
    const toElement = findElementById(
      connection.to, 
      connection.targetType, 
      collections
    );
    
    // Don't render if either element doesn't exist
    if (!fromElement || !toElement) return null;
    
    // Get the connection points on the edges of the elements
    const connectionPoints = getConnectionPoints(fromElement, toElement, connection.fromSide, connection.toSide);
    
    // Create the SVG path for the connection
    const pathData = createConnectionPath(connectionPoints);
    
    // Get the specific colors for this connection
    const strokeColor = isMultiSelected ? "#4a90e2" : "#4a90e2";
    const arrowColor = isMultiSelected ? "#4a90e2" : "#4a90e2";
    
    // Generate unique IDs for the markers based on connection ID
    const startArrowId = `arrow-start-${connection.id}`;
    const endArrowId = `arrow-end-${connection.id}`;
    
    return (
      <g className="connection-group">
        {/* Arrow marker definitions - Define them per connection for better control */}
        <defs>
          <marker
            id={startArrowId}
            viewBox="0 0 10 10"
            refX="0"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 5 L 10 0 L 10 10 z" fill={arrowColor} />
          </marker>
          <marker
            id={endArrowId}
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowColor} />
          </marker>
        </defs>
        
        {/* Curved path for the connection */}
        <path
          className={`connection-line ${isMultiSelected ? 'multi-selected' : ''}`}
          d={pathData}
          stroke={strokeColor}
          markerStart={connection.startArrow ? `url(#${startArrowId})` : ""}
          markerEnd={connection.endArrow ? `url(#${endArrowId})` : ""}
        />
        
        {/* Clickable invisible line with larger stroke width */}
        <path
          className={`connection-hitbox ${isMultiSelected ? 'multi-selected' : ''}`}
          d={pathData}
          onClick={handleClick}
        />
      </g>
    );
  } 
  // For temporary connection during drawing
  else {
    // Find source element
    let sourceType = connection.sourceType;
    let sourceId = connection.from;
    
    // If sourceType is not provided, try to infer it from the object
    if (!sourceType && typeof connection.from === 'object') {
      sourceType = connection.from.type;
      sourceId = connection.from.id;
    }
    
    const fromElement = findElementById(
      sourceId,
      sourceType,
      collections
    );
    
    if (!fromElement || !connection.to) return null;
    
    // For temporary connections during drawing
    let pathData;
    let fromSide;
    
    // If this is a temporary connection with a target element and side info
    if (connection.to.targetElement && connection.to.targetSide) {
      // Create a custom target "element" from the endpoint
      const toElement = {
        x: connection.to.x - 5, // Create a small virtual element
        y: connection.to.y - 5,
        width: 10,
        height: 10
      };
      
      // Get source edge midpoints to determine which side the connection is coming from
      const sourceMidpoints = getEdgeMidpoints(fromElement);
      let minDistance = Infinity;
      
      // Find the closest edge point on source to the target
      Object.entries(sourceMidpoints).forEach(([side, point]) => {
        const distance = Math.sqrt(
          Math.pow(point.x - connection.to.x, 2) + 
          Math.pow(point.y - connection.to.y, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          fromSide = side;
        }
      });
      
      // Get connection points with known sides
      const connectionPoints = getConnectionPoints(
        fromElement, 
        toElement,
        fromSide,
        connection.to.targetSide
      );
      
      // Create path
      pathData = createConnectionPath(connectionPoints);
    } else {
      // Simpler case - just draw to mouse position
      // Create a custom target "element" from the mouse position
      const toElement = {
        x: connection.to.x - 5, // Create a small virtual element
        y: connection.to.y - 5,
        width: 10,
        height: 10
      };
      
      // Get connection points and create path
      const connectionPoints = getConnectionPoints(fromElement, toElement);
      pathData = createConnectionPath(connectionPoints);
    }
    
    return (
      <path
        className="connection-line temporary"
        d={pathData}
        stroke="#ff6b6b"
        strokeDasharray="5,5"
        fill="none"
      />
    );
  }
};

export default Connection;