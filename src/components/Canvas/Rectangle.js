import React from 'react';
import { useCanvasContext } from '../../context/CanvasContext';
import ResizeHandles from './ResizeHandles';

const Rectangle = ({ rect, isMultiSelected }) => {
  const {
    mode,
    canvasRef,
    transform,
    selectedRectId,
    rectangles,
    postits,
    texts,
    connections,
    setRectangles,
    setPostits,
    setTexts,
    setConnections,
    setSelectedRectId,
    setSelectedPostitId,
    setSelectedTextId,
    setStartConnection,
    setConnectionSource,
    setMode,
    selectedElements,
    setSelectedElements,
    clearAllSelections
  } = useCanvasContext();

  // Handle click on a rectangle
  const handleClick = (e) => {
    e.stopPropagation();
    
    if (mode === 'delete') {
      // Delete the rectangle and its connections
      setRectangles(rectangles.filter(r => r.id !== rect.id));
      setConnections(connections.filter(conn => 
        !(conn.from === rect.id && conn.sourceType === 'rectangle') && 
        !(conn.to === rect.id && conn.targetType === 'rectangle')
      ));
      
      // Remove from selected elements if it's part of a multi-selection
      if (isMultiSelected) {
        setSelectedElements(prev => ({
          ...prev,
          rectangles: prev.rectangles.filter(id => id !== rect.id)
        }));
      }
      
      if (selectedRectId === rect.id) {
        setSelectedRectId(null);
      }
      
      // Switch back to select mode after deletion
      setMode('select');
    } else if (mode === 'connect') {
      // Start a new connection from this rectangle
      setStartConnection({
        id: rect.id,
        type: 'rectangle'
      });
      setConnectionSource('rectangle');
    } else if (mode === 'select') {
      // In select mode, handle selection behavior
      
      if (e.shiftKey) {
        // Shift+click for toggling selection
        if (isMultiSelected) {
          // If already in multi-selection, remove it
          setSelectedElements(prev => ({
            ...prev,
            rectangles: prev.rectangles.filter(id => id !== rect.id)
          }));
        } else {
          // Add to multi-selection
          setSelectedElements(prev => ({
            ...prev,
            rectangles: [...prev.rectangles, rect.id]
          }));
        }
      } else {
        // Regular click - select only this rectangle
        clearAllSelections();
        setSelectedRectId(rect.id);
      }
    }
  };

  // Move rectangles (single or multi-selected)
  const handleMouseDown = (e) => {
    if (mode === 'select') {
      e.stopPropagation();
      
      // If this rectangle is not part of the current selection,
      // make it the only selected rectangle
      if (!isMultiSelected && selectedElements.rectangles.length > 0) {
        clearAllSelections();
        setSelectedRectId(rect.id);
      } else if (!isMultiSelected && selectedRectId !== rect.id) {
        clearAllSelections();
        setSelectedRectId(rect.id);
      }
      
      const startX = e.clientX;
      const startY = e.clientY;
      
      // Get initial positions of all selected elements for multi-move
      const initialPositions = {
        rectangles: {},
        postits: {},
        texts: {}
      };
      
      // Store initial positions of selected rectangles
      if (isMultiSelected) {
        selectedElements.rectangles.forEach(id => {
          const rectangle = rectangles.find(r => r.id === id);
          if (rectangle) {
            initialPositions.rectangles[id] = { x: rectangle.x, y: rectangle.y };
          }
        });
        
        selectedElements.postits.forEach(id => {
          const postit = postits.find(p => p.id === id);
          if (postit) {
            initialPositions.postits[id] = { x: postit.x, y: postit.y };
          }
        });
        
        selectedElements.texts.forEach(id => {
          const text = texts.find(t => t.id === id);
          if (text) {
            initialPositions.texts[id] = { x: text.x, y: text.y };
          }
        });
      } else {
        // Just store this rectangle's initial position for single-move
        const originalRect = rectangles.find(r => r.id === rect.id);
        initialPositions.rectangles[rect.id] = { 
          x: originalRect.x, 
          y: originalRect.y 
        };
      }
      
      const moveHandler = (moveEvent) => {
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
                  return { 
                    ...r, 
                    x: initial.x + dx, 
                    y: initial.y + dy 
                  };
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
                  return { 
                    ...p, 
                    x: initial.x + dx, 
                    y: initial.y + dy 
                  };
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
                  return { 
                    ...t, 
                    x: initial.x + dx, 
                    y: initial.y + dy 
                  };
                }
                return t;
              })
            );
          }
        } else {
          // Just move this rectangle for single-move
          const initial = initialPositions.rectangles[rect.id];
          setRectangles(rects => 
            rects.map(r => 
              r.id === rect.id ? { 
                ...r, 
                x: initial.x + dx, 
                y: initial.y + dy 
              } : r
            )
          );
        }
      };
      
      const upHandler = () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', upHandler);
      };
      
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', upHandler);
    }
  };

  // Handle resize start
  const handleResizeStart = (e, direction) => {
    if (mode !== 'select') return;
    
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const originalRect = rectangles.find(r => r.id === rect.id);
    const { x, y, width, height } = originalRect;
    
    // Minimum dimensions to maintain
    const minWidth = 50;
    const minHeight = 40;
    
    const resizeHandler = (moveEvent) => {
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
      
      setRectangles(rects => 
        rects.map(r => 
          r.id === rect.id ? { 
            ...r, 
            x: newX, 
            y: newY, 
            width: newWidth, 
            height: newHeight 
          } : r
        )
      );
    };
    
    const upHandler = () => {
      window.removeEventListener('mousemove', resizeHandler);
      window.removeEventListener('mouseup', upHandler);
    };
    
    window.addEventListener('mousemove', resizeHandler);
    window.addEventListener('mouseup', upHandler);
  };

  // Handle text editing for rectangle
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    
    if (mode === 'select') {
      const newText = window.prompt('Edit rectangle text:', rect.content);
      if (newText !== null) {
        setRectangles(rectangles.map(r => 
          r.id === rect.id ? { ...r, content: newText } : r
        ));
      }
    }
  };

  return (
    <div
      className={`rectangle ${selectedRectId === rect.id ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''} ${mode === 'delete' ? 'deletable' : ''}`}
      style={{
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div className="rectangle-content">
        {rect.content}
      </div>
      
      {/* Show resize handles only when selected and in select mode */}
      {(selectedRectId === rect.id || isMultiSelected) && mode === 'select' && (
        <ResizeHandles onResizeStart={handleResizeStart} />
      )}
    </div>
  );
};

export default Rectangle;