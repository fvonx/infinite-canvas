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
  
  // Ref for tracking if component is mounted
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle connection click
  const handleClick = (e) => {
    if (isDragging) return; // Don't handle clicks during dragging
    
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
    
    // Start dragging
    setIsDragging(true);
    setDragEndpoint(endpoint);
    
    // Get initial position
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;
    setDragPosition({ x: mouseX, y: mouseY });
    
    // Add global event listeners for drag operations
    const handleMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      if (!isMounted.current) return;
      
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
          setHoverAnchor({
            point: nearestPoint,
            side: nearestSide,
            element: hoveredElement.element,
            type: hoveredElement.type
          });
        } else {
          setHoverAnchor(null);
        }
      } else {
        setHoverElement(null);
        setHoverAnchor(null);
      }
    };
    
    const handleMouseUp = (upEvent) => {
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (!isMounted.current) return;
      
      // If hovering over an anchor point, update the connection
      if (hoverAnchor) {
        console.log(`Dropping connection endpoint on ${hoverAnchor.side} of element ${hoverAnchor.element.id}`);
        
        setConnections(prevConnections => 
          prevConnections.map(conn => {
            if (conn.id === connection.id) {
              if (dragEndpoint === 'from') {
                // Update source endpoint
                return {
                  ...conn,
                  from: hoverAnchor.element.id,
                  sourceType: hoverAnchor.type,
                  fromSide: hoverAnchor.side
                };
              } else {
                // Update target endpoint
                return {
                  ...conn,
                  to: hoverAnchor.element.id,
                  targetType: hoverAnchor.type,
                  toSide: hoverAnchor.side
                };
              }
            }
            return conn;
          })
        );
      }
      
      // Reset drag state
      setIsDragging(false);
      setDragEndpoint(null);
      setDragPosition(null);
      setHoverElement(null);
      setHoverAnchor(null);
    };
    
    // Add event listeners to capture mouse movements anywhere on the screen
    document.addEventListener('mousemove', handleMouseMove);
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
    
    // Ensure we have fromSide and toSide
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
        } else {
          // Follow mouse otherwise
          connectionPoints.toX = dragPosition.x;
          connectionPoints.toY = dragPosition.y;
        }
      }
    }
    
    // Apply offset to keep arrows visible
    const offsetPath = (points) => {
      // Calculate unit vector along the direction
      const dx = points.toX - points.fromX;
      const dy = points.toY - points.fromY;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      // Offset amount - how far to move start and end points
      const offsetStart = 5;
      const offsetEnd = 12; // Increased offset for the end point
      
      if (length > 0) {
        const ux = dx / length;
        const uy = dy / length;
        
        // Create offset points
        return {
          ...points,
          fromX: points.fromX + ux * offsetStart,
          fromY: points.fromY + uy * offsetStart,
          toX: points.toX - ux * offsetEnd,
          toY: points.toY - uy * offsetEnd
        };
      }
      
      return points;
    };
    
    // Apply offset to move connection points slightly away from elements
    const offsetPoints = offsetPath(connectionPoints);
    
    // Create the SVG path for the connection
    const pathData = createConnectionPath(offsetPoints);
    
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

    // Setup separate SVG for endpoint handles to ensure they're above other elements
    const endpointHandles = showEndpointHandles && (
      <g className="endpoint-handles" style={{ pointerEvents: 'all', zIndex: 1000 }}>
        {/* Source endpoint handle */}
        <circle
          cx={fromPoint.x}
          cy={fromPoint.y}
          r="8"
          className="connection-endpoint"
          fill="#4a90e2"
          stroke="white"
          strokeWidth="2"
          style={{ 
            cursor: 'move', 
            pointerEvents: 'all',
            filter: 'drop-shadow(0px 0px 3px rgba(0,0,0,0.5))'
          }}
          onMouseDown={(e) => handleEndpointMouseDown(e, 'from')}
        />
        
        {/* Target endpoint handle */}
        <circle
          cx={toPoint.x}
          cy={toPoint.y}
          r="8"
          className="connection-endpoint"
          fill="#4a90e2"
          stroke="white"
          strokeWidth="2"
          style={{ 
            cursor: 'move', 
            pointerEvents: 'all',
            filter: 'drop-shadow(0px 0px 3px rgba(0,0,0,0.5))'
          }}
          onMouseDown={(e) => handleEndpointMouseDown(e, 'to')}
        />
      </g>
    );
    
    return (
      <>
        <g className="connection-group">
          {/* Arrow marker definitions - Define them per connection for better control */}
          <defs>
            <marker
              id={startArrowId}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 10 5 L 0 0 L 0 10 z" fill={arrowColor} />
            </marker>
            <marker
              id={endArrowId}
              viewBox="0 0 10 10"
              refX="0"
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
            markerEnd={connection.endArrow ? `url(#${endArrowId})` : ""}
            style={{ pointerEvents: 'none' }}
          />
          
          {/* Clickable invisible line with larger stroke width */}
          <path
            className={`connection-hitbox ${isMultiSelected ? 'multi-selected' : ''}`}
            d={pathData}
            onClick={handleClick}
          />
        </g>
        
        {/* Render anchor points on hover target during dragging */}
        {isDragging && hoverElement && (
          <g className="anchor-points" style={{ pointerEvents: 'none' }}>
            {Object.entries(getEdgeMidpoints(hoverElement.element)).map(([side, point]) => (
              <circle
                key={side}
                cx={point.x}
                cy={point.y}
                r="6"
                className={`anchor-point ${hoverAnchor && hoverAnchor.side === side ? 'active' : ''}`}
                fill={hoverAnchor && hoverAnchor.side === side ? '#ff6b6b' : '#4a90e2'}
                opacity={hoverAnchor && hoverAnchor.side === side ? 1 : 0.5}
                stroke="white"
                strokeWidth="2"
                style={{ pointerEvents: 'none' }}
              />
            ))}
          </g>
        )}
        
        {/* Render endpoint handles in a separate group to ensure they're above everything */}
        {endpointHandles}
      </>
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
      
      // Get the edge midpoints
      const fromEdges = getEdgeMidpoints(fromElement);
      const fromPoint = fromEdges[fromSide];
      
      // For target, we use the exact point as we're drawing to a precise location
      const connectionPoints = {
        fromX: fromPoint.x,
        fromY: fromPoint.y,
        toX: connection.to.x,
        toY: connection.to.y,
        fromSide,
        toSide: connection.to.targetSide
      };
      
      // Create path
      pathData = createConnectionPath(connectionPoints);
    } else {
      // Simpler case - just draw to mouse position
      // Get edge midpoints
      const fromEdges = getEdgeMidpoints(fromElement);
      
      // Determine best side
      // For temporary connections, we'll calculate based on direction to mouse
      const dx = connection.to.x - (fromElement.x + fromElement.width/2);
      const dy = connection.to.y - (fromElement.y + fromElement.height/2);
      
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal dominance
        fromSide = dx > 0 ? 'right' : 'left';
      } else {
        // Vertical dominance
        fromSide = dy > 0 ? 'bottom' : 'top';
      }
      
      const fromPoint = fromEdges[fromSide];
      
      // Direct point to mouse
      const connectionPoints = {
        fromX: fromPoint.x,
        fromY: fromPoint.y,
        toX: connection.to.x,
        toY: connection.to.y,
        fromSide,
        toSide: null
      };
      
      // Create path
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