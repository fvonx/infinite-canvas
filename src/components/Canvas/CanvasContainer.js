import React, { useEffect, useState, useRef } from 'react';
import { useCanvasContext } from '../../context/CanvasContext';
import { findElementAtCoordinates, findElementById, getEdgeMidpoints } from '../../utils/connectionUtils';
import Rectangle from './Rectangle';
import Postit from './Postit';
import TextNode from './TextNode';
import Connection from './Connection';
import SelectionBox from './SelectionBox';
import AnchorPoints from './AnchorPoints';

const CanvasContainer = () => {
  const {
    mode,
    setMode,
    canvasRef,
    contentRef,
    rectangles,
    postits,
    texts,
    connections,
    transform,
    startConnection,
    tempConnection,
    setTempConnection,
    setTransform,
    setRectangles,
    setPostits,
    setTexts,
    setConnections,
    setStartConnection,
    setConnectionSource,
    selectedRectId,
    selectedPostitId,
    selectedTextId,
    setSelectedRectId,
    setSelectedPostitId,
    setSelectedTextId,
    selectedElements,
    setSelectedElements,
    clearAllSelections,
    copySelectedElements,
    pasteElements,
    resetZoom,
    zoomIn,
    zoomOut
  } = useCanvasContext();

  // State for selection box (rubber band)
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  
  // State for anchor points when drawing connections
  const [hoverElement, setHoverElement] = useState(null);
  const [hoverAnchorPoint, setHoverAnchorPoint] = useState(null);
  
  // Global flag to track if we're in the middle of dragging selected elements
  const [isDraggingSelected, setIsDraggingSelected] = useState(false);
  
  // Listen for when elements are being dragged
  useEffect(() => {
    const handleElementDrag = (e) => {
      // Set the dragging flag to true when a drag starts
      setIsDraggingSelected(true);
    };
    
    document.addEventListener('element-drag', handleElementDrag);
    
    return () => {
      document.removeEventListener('element-drag', handleElementDrag);
    };
  }, []);
  
  // Ref to store the current selection state
  const selectedElementsRef = useRef(selectedElements);
  
  // Keep the ref updated with the latest selected elements
  useEffect(() => {
    selectedElementsRef.current = selectedElements;
  }, [selectedElements]);

  // Function to delete selected elements
  const deleteSelectedElements = () => {
    let elementsDeleted = false;

    // Check if we have any elements in multi-selection
    if (
      selectedElements.rectangles.length > 0 ||
      selectedElements.postits.length > 0 ||
      selectedElements.texts.length > 0 ||
      selectedElements.connections.length > 0
    ) {
      // Delete selected rectangles
      if (selectedElements.rectangles.length > 0) {
        setRectangles(rectangles.filter(r => !selectedElements.rectangles.includes(r.id)));
        elementsDeleted = true;
      }
      
      // Delete selected post-its
      if (selectedElements.postits.length > 0) {
        setPostits(postits.filter(p => !selectedElements.postits.includes(p.id)));
        elementsDeleted = true;
      }
      
      // Delete selected texts
      if (selectedElements.texts.length > 0) {
        setTexts(texts.filter(t => !selectedElements.texts.includes(t.id)));
        elementsDeleted = true;
      }
      
      // Delete selected connections
      if (selectedElements.connections.length > 0) {
        setConnections(connections.filter(c => !selectedElements.connections.includes(c.id)));
        elementsDeleted = true;
      }
      
      // Also delete connections to deleted elements
      const deletedRectangles = selectedElements.rectangles;
      const deletedPostits = selectedElements.postits;
      const deletedTexts = selectedElements.texts;
      
      if (deletedRectangles.length > 0 || deletedPostits.length > 0 || deletedTexts.length > 0) {
        setConnections(connections.filter(conn => {
          // Keep connection if neither source nor target is deleted
          return !(
            (conn.sourceType === 'rectangle' && deletedRectangles.includes(conn.from)) ||
            (conn.sourceType === 'postit' && deletedPostits.includes(conn.from)) ||
            (conn.sourceType === 'text' && deletedTexts.includes(conn.from)) ||
            (conn.targetType === 'rectangle' && deletedRectangles.includes(conn.to)) ||
            (conn.targetType === 'postit' && deletedPostits.includes(conn.to)) ||
            (conn.targetType === 'text' && deletedTexts.includes(conn.to))
          );
        }));
      }

      // Clear selection after deleting
      clearAllSelections();
    } else {
      // Delete single selected element using old method (backward compatibility)
      // Delete selected rectangle
      if (selectedRectId) {
        setRectangles(rectangles.filter(r => r.id !== selectedRectId));
        setConnections(connections.filter(conn => 
          !(conn.from === selectedRectId && conn.sourceType === 'rectangle') && 
          !(conn.to === selectedRectId && conn.targetType === 'rectangle')
        ));
        setSelectedRectId(null);
        elementsDeleted = true;
      }

      // Delete selected post-it
      if (selectedPostitId) {
        setPostits(postits.filter(p => p.id !== selectedPostitId));
        setConnections(connections.filter(conn => 
          !(conn.from === selectedPostitId && conn.sourceType === 'postit') && 
          !(conn.to === selectedPostitId && conn.targetType === 'postit')
        ));
        setSelectedPostitId(null);
        elementsDeleted = true;
      }

      // Delete selected text node
      if (selectedTextId) {
        setTexts(texts.filter(t => t.id !== selectedTextId));
        setConnections(connections.filter(conn => 
          !(conn.from === selectedTextId && conn.sourceType === 'text') && 
          !(conn.to === selectedTextId && conn.targetType === 'text')
        ));
        setSelectedTextId(null);
        elementsDeleted = true;
      }
    }

    return elementsDeleted;
  };

  // Add keyboard event listener for key commands
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if we're in select mode and if backspace or delete key was pressed
      if (mode === 'select' && (e.key === 'Backspace' || e.key === 'Delete')) {
        if (deleteSelectedElements()) {
          e.preventDefault(); // Prevent browser back navigation
        }
      }
      
      // Add keyboard shortcut for copy: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        if (mode === 'select') {
          console.log("Copy shortcut detected");
          if (typeof copySelectedElements === 'function') {
            const copied = copySelectedElements();
            if (copied) {
              console.log("Elements copied to clipboard");
            }
          } else {
            console.error("copySelectedElements is not a function!", copySelectedElements);
          }
        }
      }
      
      // Add keyboard shortcut for paste: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (mode === 'select') {
          console.log("Paste shortcut detected");
          if (typeof pasteElements === 'function') {
            pasteElements();
          } else {
            console.error("pasteElements is not a function!", pasteElements);
          }
        }
      }
      
      // Add keyboard shortcut for select all: Ctrl+A or Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && mode === 'select') {
        e.preventDefault(); // Prevent browser's select all
        
        // Select all elements on the canvas
        setSelectedElements({
          rectangles: rectangles.map(r => r.id),
          postits: postits.map(p => p.id),
          texts: texts.map(t => t.id),
          connections: connections.map(c => c.id)
        });
        
        // Clear individual selections to avoid conflicts
        setSelectedRectId(null);
        setSelectedPostitId(null);
        setSelectedTextId(null);
      }
      
      // Add keyboard shortcut for reset zoom: Ctrl+0 or Cmd+0
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault(); // Prevent browser's text resizing
        resetZoom();
        console.log("Zoom reset to 100%");
      }
      
      // Add keyboard shortcut to escape/cancel selection: Escape key
      if (e.key === 'Escape') {
        clearAllSelections();
        setSelectionBox(null);
        setIsSelecting(false);
      }
    };

    // Add event listener to the document to catch all keypresses
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    mode,
    selectedRectId, 
    selectedPostitId, 
    selectedTextId,
    selectedElements,
    rectangles, 
    postits, 
    texts, 
    connections,
    clearAllSelections,
    setSelectedRectId,
    setSelectedPostitId,
    setSelectedTextId,
    setSelectedElements,
    deleteSelectedElements,
    copySelectedElements,
    pasteElements,
    resetZoom
  ]);

  // Effect for handling delete mode actions
  useEffect(() => {
    if (mode === 'delete' && (
      selectedRectId || 
      selectedPostitId || 
      selectedTextId || 
      Object.values(selectedElements).some(arr => arr.length > 0)
    )) {
      // If delete mode is active and something is selected, delete it immediately
      deleteSelectedElements();
      // Switch back to select mode after deleting
      setMode('select');
    }
  }, [mode, selectedRectId, selectedPostitId, selectedTextId, selectedElements, setMode, deleteSelectedElements]);

  // Set up wheel event handler for the canvas
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const handleWheelEvent = (e) => {
      // Always prevent default to avoid browser zoom/scroll
      e.preventDefault();
      e.stopPropagation();
      
      // Check if it's a zoom event (ctrl+wheel)
      if (e.ctrlKey) {
        // Get cursor position relative to the canvas
        const rect = canvasElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Get cursor position in the canvas's coordinate system
        const mouseCanvasX = (mouseX - transform.x) / transform.scale;
        const mouseCanvasY = (mouseY - transform.y) / transform.scale;
        
        // Determine zoom direction and apply zoom
        const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
        const newScale = Math.min(Math.max(transform.scale * zoomFactor, 0.1), 5);
        
        // Adjust the transform so the point under the cursor stays in the same position
        const newX = mouseX - mouseCanvasX * newScale;
        const newY = mouseY - mouseCanvasY * newScale;
        
        setTransform({
          x: newX,
          y: newY,
          scale: newScale
        });
      } 
      // Handle panning (touchpad two-finger swipe or wheel)
      else {
        // Apply a dampening factor for smoother movement
        const dampingFactor = 0.8;
        
        // Horizontal movement
        if (Math.abs(e.deltaX) > 0) {
          setTransform(prev => ({
            ...prev,
            x: prev.x - (e.deltaX * dampingFactor)
          }));
        }
        
        // Vertical movement
        if (Math.abs(e.deltaY) > 0) {
          setTransform(prev => ({
            ...prev,
            y: prev.y - (e.deltaY * dampingFactor)
          }));
        }
      }
    };
    
    // Add wheel event listener with passive: false to allow preventDefault
    canvasElement.addEventListener('wheel', handleWheelEvent, { passive: false });
    
    return () => {
      canvasElement.removeEventListener('wheel', handleWheelEvent);
    };
  }, [canvasRef, transform, setTransform]);

  // Function to update selection based on selection box
  const updateSelectionFromBox = (selectionLeft, selectionTop, selectionRight, selectionBottom, isAdditive) => {
    // Select rectangles within the selection box
    const selectedRects = rectangles.filter(rect => 
      rect.x < selectionRight &&
      rect.x + rect.width > selectionLeft &&
      rect.y < selectionBottom &&
      rect.y + rect.height > selectionTop
    ).map(rect => rect.id);
    
    // Select post-its within the selection box
    const selectedPostits = postits.filter(postit => 
      postit.x < selectionRight &&
      postit.x + postit.width > selectionLeft &&
      postit.y < selectionBottom &&
      postit.y + postit.height > selectionTop
    ).map(postit => postit.id);
    
    // Select text nodes within the selection box
    const selectedTexts = texts.filter(text => 
      text.x < selectionRight &&
      text.x + text.width > selectionLeft &&
      text.y < selectionBottom &&
      text.y + text.height > selectionTop
    ).map(text => text.id);
    
    // Select connections that have both endpoints within the selection box
    const selectedConns = connections.filter(conn => {
      // Find source and target elements
      let fromElement, toElement;
      
      // Source element
      if (conn.sourceType === 'rectangle') {
        fromElement = rectangles.find(r => r.id === conn.from);
      } else if (conn.sourceType === 'postit') {
        fromElement = postits.find(p => p.id === conn.from);
      } else if (conn.sourceType === 'text') {
        fromElement = texts.find(t => t.id === conn.from);
      }
      
      // Target element
      if (conn.targetType === 'rectangle') {
        toElement = rectangles.find(r => r.id === conn.to);
      } else if (conn.targetType === 'postit') {
        toElement = postits.find(p => p.id === conn.to);
      } else if (conn.targetType === 'text') {
        toElement = texts.find(t => t.id === conn.to);
      }
      
      // Only include connection if both source and target are in selection
      if (!fromElement || !toElement) return false;
      
      const isFromInSelection = 
        fromElement.x < selectionRight &&
        fromElement.x + fromElement.width > selectionLeft &&
        fromElement.y < selectionBottom &&
        fromElement.y + fromElement.height > selectionTop;
        
      const isToInSelection = 
        toElement.x < selectionRight &&
        toElement.x + toElement.width > selectionLeft &&
        toElement.y < selectionBottom &&
        toElement.y + toElement.height > selectionTop;
        
      return isFromInSelection && isToInSelection;
    }).map(conn => conn.id);
    
    // Update selected elements
    // Important: Create a new object to ensure React detects the change
    const newSelectedElements = isAdditive 
      ? {
          rectangles: [...new Set([...selectedElementsRef.current.rectangles, ...selectedRects])],
          postits: [...new Set([...selectedElementsRef.current.postits, ...selectedPostits])],
          texts: [...new Set([...selectedElementsRef.current.texts, ...selectedTexts])],
          connections: [...new Set([...selectedElementsRef.current.connections, ...selectedConns])]
        }
      : {
          rectangles: selectedRects,
          postits: selectedPostits,
          texts: selectedTexts,
          connections: selectedConns
        };
    
    // Set the new selection state
    setSelectedElements(newSelectedElements);
    
    // Clear individual selections when using multi-select to avoid conflicts
    if (newSelectedElements.rectangles.length > 0 || 
        newSelectedElements.postits.length > 0 || 
        newSelectedElements.texts.length > 0 ||
        newSelectedElements.connections.length > 0) {
      setSelectedRectId(null);
      setSelectedPostitId(null);
      setSelectedTextId(null);
    }
  };

  // Find nearest anchor point to the mouse cursor
  const findNearestAnchorPoint = (element, mouseX, mouseY) => {
    if (!element) return null;
    
    const edgePoints = getEdgeMidpoints(element.element);
    let nearestPoint = null;
    let nearestDistance = Infinity;
    let nearestSide = null;
    
    // Calculate distance to each edge point
    Object.entries(edgePoints).forEach(([side, point]) => {
      const distance = Math.sqrt(
        Math.pow(point.x - mouseX, 2) + Math.pow(point.y - mouseY, 2)
      );
      
      // Update nearest point if this one is closer
      if (distance < nearestDistance && distance < 30) { // 30px snap distance
        nearestDistance = distance;
        nearestPoint = point;
        nearestSide = side;
      }
    });
    
    if (nearestPoint) {
      return {
        point: nearestPoint,
        side: nearestSide,
        element: element.element,
        type: element.type
      };
    }
    
    return null;
  };

  // Handle mouse down event to start selection box
  const handleMouseDown = (e) => {
    // Only proceed if it's a left-click directly on the canvas or content container
    // and we're in select mode
    if (
      e.button === 0 && 
      mode === 'select' && 
      (e.target === canvasRef.current || e.target === contentRef.current)
    ) {
      const rect = canvasRef.current.getBoundingClientRect();
      const startX = (e.clientX - rect.left - transform.x) / transform.scale;
      const startY = (e.clientY - rect.top - transform.y) / transform.scale;
      
      // Check if shift key is pressed for additive selection
      const isAdditive = e.shiftKey;
      
      // If not additive selection, clear previous selections unless shift is pressed
      if (!isAdditive) {
        clearAllSelections();
      }
      
      setSelectionStart({ x: startX, y: startY });
      setSelectionBox({
        startX,
        startY,
        endX: startX,
        endY: startY
      });
      setIsSelecting(true);
    }
  };

  // Handle mouse move event for both connection drawing and selection box
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;
    
    // Update temporary connection if in connect mode
    if (startConnection) {
      // Find element under mouse cursor for potential connection
      const collections = { rectangles, postits, texts };
      const hoveredElement = findElementAtCoordinates(
        mouseX, 
        mouseY,
        collections,
        startConnection.id,
        startConnection.type
      );
      
      // Update hover element state for showing anchor points
      if (hoveredElement && (!hoverElement || hoveredElement.element.id !== hoverElement.element.id)) {
        setHoverElement(hoveredElement);
        setHoverAnchorPoint(null);
      } else if (!hoveredElement && hoverElement) {
        setHoverElement(null);
        setHoverAnchorPoint(null);
      }
      
      // If hovering over a potential target element, find nearest anchor point
      if (hoverElement) {
        const nearestAnchor = findNearestAnchorPoint(hoverElement, mouseX, mouseY);
        
        // Update the hover anchor point for snapping
        if (nearestAnchor) {
          setHoverAnchorPoint(nearestAnchor);
          
          // Update the temporary connection with the snapped point
          const sourceElement = findElementById(
            startConnection.id,
            startConnection.type,
            collections
          );
          
          if (sourceElement) {
            // If we have a source element and a target anchor point, create a snapped temp connection
            setTempConnection({
              from: startConnection,
              to: { 
                id: 'temp', 
                x: nearestAnchor.point.x, 
                y: nearestAnchor.point.y,
                targetElement: hoverElement.element,
                targetSide: nearestAnchor.side,
                type: hoverElement.type
              }
            });
          }
        } else {
          // If no anchor point is close enough, just follow the mouse
          setHoverAnchorPoint(null);
          setTempConnection({
            from: startConnection,
            to: { id: 'temp', x: mouseX, y: mouseY, width: 10, height: 10 }
          });
        }
      } else {
        // If not over any element, just follow the mouse
        setTempConnection({
          from: startConnection,
          to: { id: 'temp', x: mouseX, y: mouseY, width: 10, height: 10 }
        });
      }
    }
    
    // Update selection box if we're in the process of selecting
    if (isSelecting && mode === 'select') {
      const currentX = (e.clientX - rect.left - transform.x) / transform.scale;
      const currentY = (e.clientY - rect.top - transform.y) / transform.scale;
      
      setSelectionBox(prev => ({
        ...prev,
        endX: currentX,
        endY: currentY
      }));
      
      // Determine which elements are within the selection box
      const selectionLeft = Math.min(selectionStart.x, currentX);
      const selectionTop = Math.min(selectionStart.y, currentY);
      const selectionRight = Math.max(selectionStart.x, currentX);
      const selectionBottom = Math.max(selectionStart.y, currentY);
      
      // Check if shift key is pressed for additive selection
      const isAdditive = e.shiftKey;
      
      // Update selection based on current selection box
      updateSelectionFromBox(selectionLeft, selectionTop, selectionRight, selectionBottom, isAdditive);
    }
  };

  // Handle mouse up event for connection completion and selection
  const handleMouseUp = (e) => {
    // Complete connection if in connect mode
    if (startConnection) {
      // If we have a snapped anchor point, use it for the connection
      if (hoverAnchorPoint) {
        const newConnection = {
          id: Date.now(),
          from: startConnection.id,
          to: hoverAnchorPoint.element.id,
          sourceType: startConnection.type,
          targetType: hoverAnchorPoint.type,
          fromSide: startConnection.side,
          toSide: hoverAnchorPoint.side
        };
        
        setConnections([...connections, newConnection]);
      } else {
        // Traditional method as fallback
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
        const mouseY = (e.clientY - rect.top - transform.y) / transform.scale;
        
        const collections = { rectangles, postits, texts };
        const targetElement = findElementAtCoordinates(
          mouseX, 
          mouseY,
          collections,
          startConnection.id,
          startConnection.type
        );
        
        if (targetElement) {
          const newConnection = {
            id: Date.now(),
            from: startConnection.id,
            to: targetElement.element.id,
            sourceType: startConnection.type,
            targetType: targetElement.type
          };
          
          setConnections([...connections, newConnection]);
        }
      }
      
      // Clear connection state
      setStartConnection(null);
      setTempConnection(null);
      setConnectionSource(null);
      setHoverElement(null);
      setHoverAnchorPoint(null);
    }
    
    // If we were dragging selected elements, don't clear the selection
    // and reset the dragging flag after a delay
    if (isDraggingSelected) {
      // Keep the selection intact!
      // Just reset the flag after a short delay to allow for other click events
      setTimeout(() => {
        setIsDraggingSelected(false);
      }, 50);
      
      // Important: Exit early to prevent selection clearing
      return;
    }
    
    // Finish selection box if we're selecting
    if (isSelecting) {
      // Determine if this was a small click or a real drag
      const width = Math.abs(selectionBox.endX - selectionBox.startX);
      const height = Math.abs(selectionBox.endY - selectionBox.startY);
      const wasRealDrag = width >= 5 || height >= 5;
      
      // If it was a small click on empty canvas (not a drag), clear selections
      if (!wasRealDrag && (e.target === canvasRef.current || e.target === contentRef.current)) {
        clearAllSelections();
      }
      
      // If it was a real drag, make sure the selection is finalized
      if (wasRealDrag && selectionBox) {
        const selectionLeft = Math.min(selectionBox.startX, selectionBox.endX);
        const selectionTop = Math.min(selectionBox.startY, selectionBox.endY);
        const selectionRight = Math.max(selectionBox.startX, selectionBox.endX);
        const selectionBottom = Math.max(selectionBox.startY, selectionBox.endY);
        
        // Check if shift key is pressed for additive selection
        const isAdditive = e.shiftKey;
        
        // Final update of selection
        updateSelectionFromBox(selectionLeft, selectionTop, selectionRight, selectionBottom, isAdditive);
      }
      
      // Clear selection state and hide the selection box with a small delay
      // to ensure the visual feedback of what was selected
      setIsSelecting(false);
      if (wasRealDrag) {
        setTimeout(() => {
          setSelectionBox(null);
        }, 100);
      } else {
        setSelectionBox(null);
      }
    }
  };

  // Handle mouse leave event
  const handleMouseLeave = () => {
    // Cancel any active connection
    if (startConnection) {
      setStartConnection(null);
      setTempConnection(null);
      setConnectionSource(null);
      setHoverElement(null);
      setHoverAnchorPoint(null);
    }
    
    // Don't clear selection when mouse leaves the canvas
    // Only clean up the selection box UI
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionBox(null);
    }
    
    // Don't reset isDraggingSelected here to prevent selection loss
    // when mouse briefly leaves canvas during dragging
  };

  // Create a canvas element when clicking on empty canvas
  const handleCanvasClick = (e) => {
    // Only proceed if the click is directly on the canvas or content container
    if (e.target === canvasRef.current || e.target === contentRef.current) {
      if (mode === 'rectangle') {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - transform.x) / transform.scale;
        const y = (e.clientY - rect.top - transform.y) / transform.scale;
        
        const newRect = {
          id: Date.now(),
          x,
          y,
          width: 150,
          height: 80,
          content: 'New Box'
        };
        
        setRectangles([...rectangles, newRect]);
        
        // Clear any existing selections
        clearAllSelections();
        
        // Select the newly created rectangle
        setSelectedRectId(newRect.id);
        
        // Switch to select mode after creating a rectangle
        setMode('select');
      } else if (mode === 'postit') {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - transform.x) / transform.scale;
        const y = (e.clientY - rect.top - transform.y) / transform.scale;
        
        const newPostit = {
          id: Date.now(),
          x,
          y,
          width: 150,
          height: 150,
          content: 'New Post-it',
          backgroundColor: '#FFEFB5' // Default post-it color
        };
        
        setPostits([...postits, newPostit]);
        
        // Clear any existing selections
        clearAllSelections();
        
        // Select the newly created post-it
        setSelectedPostitId(newPostit.id);
        
        // Switch to select mode after creating a post-it
        setMode('select');
      } else if (mode === 'text') {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - transform.x) / transform.scale;
        const y = (e.clientY - rect.top - transform.y) / transform.scale;
        
        // Prompt for text content immediately
        const textContent = window.prompt('Enter text:');
        
        // Only create a text node if content is not empty
        if (textContent && textContent.trim() !== '') {
          const newText = {
            id: Date.now(),
            x,
            y,
            width: 200, // Initial width, will adjust based on content
            height: 30, // Initial height, will adjust based on content
            content: textContent
          };
          
          setTexts([...texts, newText]);
          
          // Clear any existing selections
          clearAllSelections();
          // Select the newly created text node
          setSelectedTextId(newText.id);
          
          // Switch to select mode after creating a text node
          setMode('select');
        }
      } else if (mode === 'delete') {
        // If in delete mode and clicked on empty canvas, just deselect and switch back to select mode
        clearAllSelections();
        setMode('select');
      }
    }
  };

  return (
    <div 
      ref={canvasRef}
      className={`canvas-container mode-${mode}`}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleCanvasClick}
    >
      <div 
        ref={contentRef}
        className="canvas-content"
      >
        {/* Render rectangles */}
        {rectangles.map(rect => (
          <Rectangle 
            key={rect.id} 
            rect={rect}
            isMultiSelected={selectedElements.rectangles.includes(rect.id)}
          />
        ))}
        
        {/* Render post-its */}
        {postits.map(postit => (
          <Postit 
            key={postit.id} 
            postit={postit}
            isMultiSelected={selectedElements.postits.includes(postit.id)}
          />
        ))}
        
        {/* Render text nodes */}
        {texts.map(text => (
          <TextNode 
            key={text.id} 
            text={text}
            isMultiSelected={selectedElements.texts.includes(text.id)}
          />
        ))}
        
        {/* Render connection lines */}
        <svg className="connections-svg" width="100%" height="100%" style={{ overflow: 'visible' }}>
          {/* Arrow marker definitions */}
          <defs>
            <marker
              id="arrow-start"
              viewBox="0 0 10 10"
              refX="1"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a90e2" />
            </marker>
            <marker
              id="arrow-end"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a90e2" />
            </marker>
          </defs>
          
          {connections.map((conn, index) => (
            <Connection 
              key={index} 
              connection={conn}
              isMultiSelected={selectedElements.connections.includes(conn.id)}
            />
          ))}
          
          {/* Render temporary connection when creating a new one */}
          {tempConnection && (
            <Connection temporary connection={tempConnection} />
          )}
        </svg>
        
        {/* Render anchor points for connection target */}
        {hoverElement && mode === 'connect' && (
          <AnchorPoints 
            element={hoverElement.element} 
            type={hoverElement.type}
            activeAnchor={hoverAnchorPoint?.side}
          />
        )}
        
        {/* Render selection box (rubber band) if active */}
        {selectionBox && <SelectionBox selectionBox={selectionBox} />}
      </div>
    </div>
  );
};

export default CanvasContainer;