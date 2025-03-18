import React, { useState, useEffect, useRef } from 'react';
import { useCanvasContext } from '../../context/CanvasContext';
import { 
  findElementById, 
  findElementAtCoordinates,
  getConnectionPoints, 
  createConnectionPath,
  getEdgeMidpoints
} from '../../utils/connectionUtils';

const Connection = ({ connection, temporary = false, isMultiSelected = false }) => {
  const { 
    mode, 
    transform,
    canvasRef,
    rectangles, 
    postits, 
    texts, 
    connections, 
    setConnections,
    selectedElements,
    setSelectedElements,
    clearAllSelections
  } = useCanvasContext();

  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragEndpoint, setDragEndpoint] = useState(null);
  const [dragPosition, setDragPosition] = useState(null);
  const [hoverElement, setHoverElement] = useState(null);
  const [hoverAnchor, setHoverAnchor] = useState(null);
  
  // Refs for cleanup
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle connection click
  const handleClick = (e) => {
    if (window.isDragging) return;
    
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

  // Handle endpoint mousedown
  const handleEndpointMouseDown = (e, endpoint) => {
    if (mode !== 'select' || temporary) return;
    
    // Ensure we capture this event completely
    e.stopPropagation();
    e.preventDefault();
    
    console.log(`Drag started on ${endpoint} endpoint of connection ${connection.id}`);
    
    // Select this connection
    clearAllSelections();
    setSelectedElements({
      rectangles: [],
      postits: [],
      texts: [],
      connections: [connection.id]
    });
    
    // Set global drag flag to prevent click handlers
    window.isDragging = true;
    
    // Start dragging
    setIsDragging(true);
    setDragEndpoint(endpoint);
    
    // Get initial position
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;
    setDragPosition({ x: mouseX, y: mouseY });
    
    // Initialize for handle element finding
    let hoveredEl = null;
    let hoveredAnchor = null;
    
    const handleMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      // Get mouse position
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const mouseX = (moveEvent.clientX - canvasRect.left - transform.x) / transform.scale;
      const mouseY = (moveEvent.clientY - canvasRect.top - transform.y) / transform.scale;
      
      // Update drag position
      setDragPosition({ x: mouseX, y: mouseY });
      
      // Find element under cursor
      const collections = { rectangles, postits, texts };
      const excludeId = endpoint === 'from' ? connection.to : connection.from;
      const excludeType = endpoint === 'from' ? connection.targetType : connection.sourceType;
      
      const hoveredElement = findElementAtCoordinates(
        mouseX,
        mouseY,
        collections,
        excludeId,
        excludeType
      );
      
      // Store reference for mouseUp handler
      hoveredEl = hoveredElement;
      
      // Update hover element state
      if (hoveredElement) {
        setHoverElement(hoveredElement);
        
        // Find nearest anchor point
        const edgePoints = getEdgeMidpoints(hoveredElement.element);
        let minDistance = Infinity;
        let nearestSide = null;
        let nearestPoint = null;
        
        Object.entries(edgePoints).forEach(([side, point]) => {
          const distance = Math.sqrt(
            Math.pow(point.x - mouseX, 2) + 
            Math.pow(point.y - mouseY, 2)
          );
          
          if (distance < minDistance && distance < 30) {
            minDistance = distance;
            nearestSide = side;
            nearestPoint = point;
          }
        });
        
        if (nearestPoint) {
          const anchor = {
            point: nearestPoint,
            side: nearestSide,
            element: hoveredElement.element,
            type: hoveredElement.type
          };
          setHoverAnchor(anchor);
          hoveredAnchor = anchor; // Store reference for mouseUp handler
        } else {
          setHoverAnchor(null);
          hoveredAnchor = null;
        }
      } else {
        setHoverElement(null);
        setHoverAnchor(null);
        hoveredEl = null;
        hoveredAnchor = null;
      }
    };
    
    const handleMouseUp = (upEvent) => {
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // If we have a valid anchor point, update the connection
      if (hoveredAnchor) {
        console.log(`Dropping connection endpoint on ${hoveredAnchor.side} of element ${hoveredAnchor.element.id}`);
        
        // Create a copy of all connections
        const updatedConnections = [...connections];
        
        // Find and update the specific connection
        const connIndex = updatedConnections.findIndex(conn => conn.id === connection.id);
        
        if (connIndex !== -1) {
          const updatedConnection = {...updatedConnections[connIndex]};
          
          if (endpoint === 'from') {
            // Update source endpoint
            updatedConnection.from = hoveredAnchor.element.id;
            updatedConnection.sourceType = hoveredAnchor.type;
            updatedConnection.fromSide = hoveredAnchor.side;
          } else {
            // Update target endpoint
            updatedConnection.to = hoveredAnchor.element.id;
            updatedConnection.targetType = hoveredAnchor.type;
            updatedConnection.toSide = hoveredAnchor.side;
          }
          
          // Replace the connection in the array
          updatedConnections[connIndex] = updatedConnection;
          
          // Update all connections
          setConnections(updatedConnections);
        }
      }
      
      // Reset states AFTER updating connection
      window.isDragging = false;
      setIsDragging(false);
      setDragEndpoint(null);
      setDragPosition(null);
      setHoverElement(null);
      setHoverAnchor(null);
    };
    
    // Add event listeners to capture mouse movements anywhere on the screen
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
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
    
    // Get edge midpoints for source and target elements
    const fromEdges = getEdgeMidpoints(fromElement);
    const toEdges = getEdgeMidpoints(toElement);
    
    // Ensure we have fromSide and toSide with proper defaults
    const fromSide = connection.fromSide || 'right';
    const toSide = connection.toSide || 'left';
    
    // Get points directly from the specified sides
    const fromPoint = fromEdges[fromSide];
    const toPoint = toEdges[toSide];
    
    // Construct connection points object
    let connectionPoints = {
      fromX: fromPoint.x,
      fromY: fromPoint.y,
      toX: toPoint.x,
      toY: toPoint.y,
      fromSide,
      toSide
    };
    
    // Override with drag position if dragging
    if (isDragging && dragPosition) {
      if (dragEndpoint === 'from') {
        // If dragging source endpoint
        if (hoverAnchor) {
          // Snap to anchor point if hovering over one
          connectionPoints.fromX = hoverAnchor.point.x;
          connectionPoints.fromY = hoverAnchor.point.y;
          connectionPoints.fromSide = hoverAnchor.side;
        } else {
          // Follow mouse otherwise
          connectionPoints.fromX = dragPosition.x;
          connectionPoints.fromY = dragPosition.y;
        }
      } else if (dragEndpoint === 'to') {
        // If dragging target endpoint
        if (hoverAnchor) {
          // Snap to anchor point if hovering over one
          connectionPoints.toX = hoverAnchor.point.x;
          connectionPoints.toY = hoverAnchor.point.y;
          connectionPoints.toSide = hoverAnchor.side;
        } else {
          // Follow mouse otherwise
          connectionPoints.toX = dragPosition.x;
          connectionPoints.toY = dragPosition.y;
        }
      }
    }

    // Create the SVG path for the connection
    const pathData = createConnectionPath(connectionPoints);
    
    // Get the specific colors for this connection
    const strokeColor = isMultiSelected ? "#4a90e2" : "#4a90e2";
    const arrowColor = isMultiSelected ? "#4a90e2" : "#4a90e2";
    
    // Generate unique IDs for the markers based on connection ID
    const startArrowId = `arrow-start-${connection.id}`;
    const endArrowId = `arrow-end-${connection.id}`;
    
    // Determine if this connection is currently selected
    const isSelected = selectedElements.connections.includes(connection.id);
    
    // Only show endpoint handles in select mode and when the connection is selected
    const showEndpointHandles = !temporary && mode === 'select' && isSelected;

    return (
      <>
        <g className="connection-group">
          {/* Arrow marker definitions */}
          <defs>
            <marker
              id={startArrowId}
              viewBox="0 0 10 10"
              refX="3"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowColor} />
            </marker>
            <marker
              id={endArrowId}
              viewBox="0 0 10 10"
              refX="7"
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
            className={`connection-line ${isMultiSelected ? 'multi-selected' : ''} ${isSelected ? 'selected' : ''} ${isDragging ? 'endpoint-dragging' : ''}`}
            d={pathData}
            stroke={strokeColor}
            strokeWidth="2"
            markerStart={connection.startArrow ? `url(#${startArrowId})` : ""}
            markerEnd={connection.endArrow !== false ? `url(#${endArrowId})` : ""}
            fill="none"
            style={{ pointerEvents: 'none' }}
          />
          
          {/* Clickable invisible line with larger stroke width */}
          <path
            className={`connection-hitbox ${isMultiSelected ? 'multi-selected' : ''}`}
            d={pathData}
            stroke="transparent"
            strokeWidth="15"
            fill="none"
            onClick={handleClick}
          />
        </g>
        
        {/* Render anchor points on hover target during dragging */}
        {isDragging && hoverElement && (
          <g className="anchor-points" pointerEvents="none">
            {Object.entries(getEdgeMidpoints(hoverElement.element)).map(([side, point]) => (
              <circle
                key={side}
                cx={point.x}
                cy={point.y}
                r={hoverAnchor && hoverAnchor.side === side ? "8" : "6"}
                fill={hoverAnchor && hoverAnchor.side === side ? '#ff6b6b' : '#4a90e2'}
                opacity={hoverAnchor && hoverAnchor.side === side ? 1 : 0.5}
                stroke="white"
                strokeWidth="2"
                pointerEvents="none"
              />
            ))}
          </g>
        )}
        
        {/* Source endpoint handle */}
        {showEndpointHandles && (
          <>
            <circle
              cx={fromPoint.x}
              cy={fromPoint.y}
              r="8"
              fill="#4a90e2"
              stroke="white"
              strokeWidth="2"
              style={{ 
                cursor: 'move',
                pointerEvents: 'all'
              }}
              onMouseDown={(e) => handleEndpointMouseDown(e, 'from')}
            />
            
            {/* Target endpoint handle */}
            <circle
              cx={toPoint.x}
              cy={toPoint.y}
              r="8"
              fill="#4a90e2"
              stroke="white"
              strokeWidth="2"
              style={{ 
                cursor: 'move',
                pointerEvents: 'all'
              }}
              onMouseDown={(e) => handleEndpointMouseDown(e, 'to')}
            />
          </>
        )}
      </>
    );
  } 
  // For temporary connection during drawing
  else {
    // Find source element
    let sourceType, sourceId;
    
    // Handle different ways the connection source might be specified
    if (typeof connection.from === 'object') {
      sourceType = connection.from.type;
      sourceId = connection.from.id;
    } else {
      sourceType = connection.sourceType;
      sourceId = connection.from;
    }
    
    // Make sure we have a valid source element
    if (!sourceId || !sourceType) {
      console.error("Invalid source for temporary connection", connection);
      return null;
    }
    
    const fromElement = findElementById(
      sourceId,
      sourceType,
      collections
    );
    
    // Make sure we have the source element and target position
    if (!fromElement || !connection.to) {
      return null;
    }
    
    // For temporary connections during drawing
    let pathData;
    
    // Get edge midpoints for source element
    const fromEdges = getEdgeMidpoints(fromElement);
    
    // Determine best side based on direction to mouse/target
    const targetX = connection.to.x || connection.to.targetX || 0;
    const targetY = connection.to.y || connection.to.targetY || 0;
    
    const dx = targetX - (fromElement.x + fromElement.width/2);
    const dy = targetY - (fromElement.y + fromElement.height/2);
    
    let fromSide;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal dominance
      fromSide = dx > 0 ? 'right' : 'left';
    } else {
      // Vertical dominance
      fromSide = dy > 0 ? 'bottom' : 'top';
    }
    
    const fromPoint = fromEdges[fromSide];
    
    // Create connection points for the path
    const connectionPoints = {
      fromX: fromPoint.x,
      fromY: fromPoint.y,
      toX: targetX,
      toY: targetY,
      fromSide,
      toSide: connection.to.targetSide || null
    };
    
    // Create path
    pathData = createConnectionPath(connectionPoints);
    
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