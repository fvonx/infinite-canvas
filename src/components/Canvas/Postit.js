import React from 'react';
import { useCanvasContext } from '../../context/CanvasContext';
import ResizeHandles from './ResizeHandles';

const Postit = ({ postit, isMultiSelected }) => {
  const {
    mode,
    transform,
    selectedRectId,
    selectedPostitId,
    selectedTextId,
    rectangles,
    postits,
    texts,
    connections,
    setPostits,
    setRectangles,
    setTexts,
    setConnections,
    setSelectedRectId,
    setSelectedPostitId,
    setSelectedTextId,
    setStartConnection,
    setTempConnection,
    setConnectionSource,
    setMode,
    selectedElements,
    setSelectedElements,
    clearAllSelections
  } = useCanvasContext();

  // Handle click on a post-it
  const handleClick = (e) => {
    // Don't handle click events during drag operations
    if (window.isMouseDragging) {
      e.stopPropagation();
      return;
    }
    
    e.stopPropagation();
    
    if (mode === 'delete') {
      // Delete the post-it and its connections
      setPostits(postits.filter(p => p.id !== postit.id));
      setConnections(connections.filter(conn => 
        !(conn.from === postit.id && conn.sourceType === 'postit') && 
        !(conn.to === postit.id && conn.targetType === 'postit')
      ));
      
      // Remove from selected elements if it's part of a multi-selection
      if (isMultiSelected) {
        setSelectedElements(prev => ({
          ...prev,
          postits: prev.postits.filter(id => id !== postit.id)
        }));
      }
      
      if (selectedPostitId === postit.id) {
        setSelectedPostitId(null);
      }
      
      // Switch back to select mode after deletion
      setMode('select');
    } else if (mode === 'connect') {
      // Start a new connection from this post-it
      console.log("Starting connection from post-it:", postit.id);
      
      // Very important: Set connection information
      setStartConnection({
        id: postit.id,
        type: 'postit'
      });
      
      setConnectionSource('postit');
      
      // Initialize temporary connection with current mouse position
      const canvasRect = document.querySelector('.canvas-container').getBoundingClientRect();
      const mouseX = (e.clientX - canvasRect.left - transform.x) / transform.scale;
      const mouseY = (e.clientY - canvasRect.top - transform.y) / transform.scale;
      
      setTempConnection({
        from: {
          id: postit.id,
          type: 'postit'
        },
        to: { 
          id: 'temp', 
          x: mouseX, 
          y: mouseY 
        }
      });
    } else if (mode === 'select') {
      // In select mode, handle selection behavior
      
      if (e.shiftKey) {
        // Shift+click for toggling selection
        if (isMultiSelected) {
          // If already in multi-selection, remove it
          setSelectedElements(prev => ({
            ...prev,
            postits: prev.postits.filter(id => id !== postit.id)
          }));
        } else {
          // Add to multi-selection - preserve existing selections
          setSelectedElements(prev => ({
            ...prev,
            postits: [...prev.postits, postit.id]
          }));
          
          // Clear the individual selection to avoid conflicts
          if (selectedPostitId === postit.id) {
            setSelectedPostitId(null);
          }
        }
      } else {
        // Regular click - select only this post-it
        clearAllSelections();
        setSelectedPostitId(postit.id);
      }
    }
  };

  // Move post-it and any other selected elements
  const handleMouseDown = (e) => {
    if (mode === 'select') {
      e.stopPropagation();
      
      // Store the current selection state to restore it after drag
      const currentSelection = {
        selectedRectId,
        selectedPostitId,
        selectedTextId,
        selectedElements: {...selectedElements}
      };
      
      // Global flag to indicate we're dragging
      window.isMouseDragging = false;
      
      // If this post-it is not already selected and not part of a multi-selection,
      // select it on mouse down unless shift is pressed
      if (!isMultiSelected && selectedPostitId !== postit.id && !e.shiftKey) {
        clearAllSelections();
        setSelectedPostitId(postit.id);
      }
      
      const startX = e.clientX;
      const startY = e.clientY;
      
      // Get initial positions of all selected elements for multi-move
      const initialPositions = {
        rectangles: {},
        postits: {},
        texts: {}
      };
      
      // Store initial positions of selected elements
      if (isMultiSelected) {
        selectedElements.rectangles.forEach(id => {
          const rectangle = rectangles.find(r => r.id === id);
          if (rectangle) {
            initialPositions.rectangles[id] = { x: rectangle.x, y: rectangle.y };
          }
        });
        
        selectedElements.postits.forEach(id => {
          const item = postits.find(p => p.id === id);
          if (item) {
            initialPositions.postits[id] = { x: item.x, y: item.y };
          }
        });
        
        selectedElements.texts.forEach(id => {
          const text = texts.find(t => t.id === id);
          if (text) {
            initialPositions.texts[id] = { x: text.x, y: text.y };
          }
        });
      } else {
        // Just store this post-it's initial position for single-move
        const originalPostit = postits.find(p => p.id === postit.id);
        initialPositions.postits[postit.id] = { 
          x: originalPostit.x, 
          y: originalPostit.y 
        };
      }
      
      const moveHandler = (moveEvent) => {
        // Set dragging flag to true when movement starts
        window.isMouseDragging = true;
        
        const dx = (moveEvent.clientX - startX) / transform.scale;
        const dy = (moveEvent.clientY - startY) / transform.scale;
        
        // Move all selected elements if we're multi-selecting
        if (isMultiSelected) {
          // Update selected rectangles
          if (selectedElements.rectangles.length > 0) {
            setRectangles(rects => 
              rects.map(r => {
                if (selectedElements.rectangles.includes(r.id)) {
                  const initial = initialPositions.rectangles[r.id];
                  return initial ? { 
                    ...r, 
                    x: initial.x + dx, 
                    y: initial.y + dy 
                  } : r;
                }
                return r;
              })
            );
          }
          
          // Update selected post-its
          if (selectedElements.postits.length > 0) {
            setPostits(items => 
              items.map(p => {
                if (selectedElements.postits.includes(p.id)) {
                  const initial = initialPositions.postits[p.id];
                  return initial ? { 
                    ...p, 
                    x: initial.x + dx, 
                    y: initial.y + dy 
                  } : p;
                }
                return p;
              })
            );
          }
          
          // Update selected texts
          if (selectedElements.texts.length > 0) {
            setTexts(items => 
              items.map(t => {
                if (selectedElements.texts.includes(t.id)) {
                  const initial = initialPositions.texts[t.id];
                  return initial ? { 
                    ...t, 
                    x: initial.x + dx, 
                    y: initial.y + dy 
                  } : t;
                }
                return t;
              })
            );
          }
        } else {
          // Just move this post-it for single-move
          const initial = initialPositions.postits[postit.id];
          if (initial) {
            setPostits(items => 
              items.map(p => 
                p.id === postit.id ? { 
                  ...p, 
                  x: initial.x + dx, 
                  y: initial.y + dy 
                } : p
              )
            );
          }
        }
      };
      
      const upHandler = (upEvent) => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', upHandler);
        
        // If we've been dragging, restore the original selection state
        // This is the key to fix the issue - always restore the multi-selection after dragging
        if (window.isMouseDragging && isMultiSelected) {
          // Reset the selection state to what it was before dragging
          setSelectedElements(currentSelection.selectedElements);
          
          // Prevent the click handler from firing after drag
          upEvent.stopPropagation();
          
          // Reset the dragging flag after a short delay
          setTimeout(() => {
            window.isMouseDragging = false;
          }, 50);
        } else {
          window.isMouseDragging = false;
        }
      };
      
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', upHandler);
    }
  };

  // Handle resize start
  const handleResizeStart = (e, direction) => {
    if (mode !== 'select') return;
    
    e.stopPropagation();
    
    // Store the current selection state to restore it after resize
    const currentSelection = {
      selectedRectId,
      selectedPostitId,
      selectedTextId,
      selectedElements: {...selectedElements}
    };
    
    // Global flag to indicate we're dragging
    window.isMouseDragging = false;
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const originalPostit = postits.find(p => p.id === postit.id);
    const { x, y, width, height } = originalPostit;
    
    // Minimum dimensions to maintain (post-its are usually square-ish)
    const minWidth = 80;
    const minHeight = 80;
    
    const resizeHandler = (moveEvent) => {
      // Set dragging flag to true when movement starts
      window.isMouseDragging = true;
      
      const dx = (moveEvent.clientX - startX) / transform.scale;
      const dy = (moveEvent.clientY - startY) / transform.scale;
      
      let newX = x;
      let newY = y;
      let newWidth = width;
      let newHeight = height;
      
      // Apply changes based on resize direction
      if (direction.includes('n')) {
        newY = Math.min(y + dy, y + height - minHeight);
        newHeight = Math.max(height - dy, minHeight);
      }
      if (direction.includes('e')) {
        newWidth = Math.max(width + dx, minWidth);
      }
      if (direction.includes('s')) {
        newHeight = Math.max(height + dy, minHeight);
      }
      if (direction.includes('w')) {
        newX = Math.min(x + dx, x + width - minWidth);
        newWidth = Math.max(width - dx, minWidth);
      }
      
      setPostits(items => 
        items.map(p => 
          p.id === postit.id ? { 
            ...p, 
            x: newX, 
            y: newY, 
            width: newWidth, 
            height: newHeight 
          } : p
        )
      );
    };
    
    const upHandler = (upEvent) => {
      window.removeEventListener('mousemove', resizeHandler);
      window.removeEventListener('mouseup', upHandler);
      
      // If we've been dragging, restore the original selection state
      if (window.isMouseDragging && isMultiSelected) {
        // Reset the selection state to what it was before resize
        setSelectedElements(currentSelection.selectedElements);
        
        // Prevent the click handler from firing after resize
        upEvent.stopPropagation();
        
        // Reset the dragging flag after a short delay
        setTimeout(() => {
          window.isMouseDragging = false;
        }, 50);
      } else {
        window.isMouseDragging = false;
      }
    };
    
    window.addEventListener('mousemove', resizeHandler);
    window.addEventListener('mouseup', upHandler);
  };

  // Handle text editing for post-it
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    
    if (mode === 'select') {
      const newText = window.prompt('Edit post-it text:', postit.content);
      if (newText !== null) {
        setPostits(postits.map(p => 
          p.id === postit.id ? { ...p, content: newText } : p
        ));
      }
    }
  };

  return (
    <div
      className={`postit ${selectedPostitId === postit.id ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''} ${mode === 'delete' ? 'deletable' : ''}`}
      style={{
        left: `${postit.x}px`,
        top: `${postit.y}px`,
        width: `${postit.width}px`,
        height: `${postit.height}px`,
        backgroundColor: postit.backgroundColor || '#FFEFB5' // Updated to match pastel yellow from color picker
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div className="postit-content">
        {postit.content}
      </div>
      
      {/* Show resize handles only when selected and in select mode */}
      {(selectedPostitId === postit.id || isMultiSelected) && mode === 'select' && (
        <ResizeHandles onResizeStart={handleResizeStart} />
      )}
    </div>
  );
};

export default Postit;