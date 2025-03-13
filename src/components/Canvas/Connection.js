import React from 'react';
import { useCanvasContext } from '../../context/CanvasContext';
import { findElementById, getConnectionPoints } from '../../utils/connectionUtils';

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
    
    const { fromX, fromY, toX, toY } = getConnectionPoints(fromElement, toElement);
    
    return (
      <g className="connection-group">
        {/* Curved path for the connection */}
        <path
          className={`connection-line ${isMultiSelected ? 'multi-selected' : ''}`}
          d={`M${fromX},${fromY} C${fromX + (toX - fromX) / 2},${fromY} ${toX - (toX - fromX) / 2},${toY} ${toX},${toY}`}
        />
        {/* Clickable invisible line with larger stroke width */}
        <path
          className={`connection-hitbox ${isMultiSelected ? 'multi-selected' : ''}`}
          d={`M${fromX},${fromY} C${fromX + (toX - fromX) / 2},${fromY} ${toX - (toX - fromX) / 2},${toY} ${toX},${toY}`}
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
    
    const { fromX, fromY } = getConnectionPoints(
      fromElement, 
      { x: 0, y: 0, width: 0, height: 0 } // Dummy target
    );
    
    return (
      <path
        className="connection-line temporary"
        d={`M${fromX},${fromY} C${fromX + (connection.to.x - fromX) / 2},${fromY} ${connection.to.x - (connection.to.x - fromX) / 2},${connection.to.y} ${connection.to.x},${connection.to.y}`}
      />
    );
  }
};

export default Connection;