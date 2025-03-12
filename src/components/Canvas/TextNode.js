import React from 'react';
import { useCanvasContext } from '../../context/CanvasContext';
import ResizeHandles from './ResizeHandles';

const TextNode = ({ text, isMultiSelected }) => {
  const {
    mode,
    transform,
    selectedTextId,
    rectangles,
    postits,
    texts,
    connections,
    setTexts,
    setRectangles,
    setPostits,
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

  // Handle click on a text node
  const handleClick = (e) => {
    e.stopPropagation();
    
    if (mode === 'delete') {
      // Delete the text node and its connections
      setTexts(texts.filter(t => t.id !== text.id));
      setConnections(connections.filter(conn => 
        !(conn.from === text.id && conn.sourceType === 'text') && 
        !(conn.to === text.id && conn.targetType === 'text')
      ));
      
      // Remove from selected elements if it's part of a multi-selection
      if (isMultiSelected) {
        setSelectedElements(prev => ({
          ...prev,
          texts: prev.texts.filter(id => id !== text.id)
        }));
      }
      
      if (selectedTextId === text.id) {
        setSelectedTextId(null);
      }
      
      // Switch back to select mode after deletion
      setMode('select');
    } else if (mode === 'connect') {
      // Start a new connection from this text node
      setStartConnection({
        id: text.id,
        type: 'text'
      });
      setConnectionSource('text');
    } else if (mode === 'select') {
      // In select mode, handle selection behavior
      
      if (e.shiftKey) {
        // Shift+click for toggling selection
        if (isMultiSelected) {
          // If already in multi-selection, remove it
          setSelectedElements(prev => ({
            ...prev,
            texts: prev.texts.filter(id => id !== text.id)
          }));
        } else {
          // Add to multi-selection
          setSelectedElements(prev => ({
            ...prev,
            texts: [...prev.texts, text.id]
          }));
        }
      } else {
        // Regular click - select only this text node
        clearAllSelections();
        setSelectedTextId(text.id);
      }
    }
  };

  // Move text and any other selected elements
  const handleMouseDown = (e) => {
    if (mode === 'select') {
      e.stopPropagation();
      
      // If this text node is not part of the current selection,
      // make it the only selected text node
      if (!isMultiSelected && selectedElements.texts.length > 0) {
        clearAllSelections();
        setSelectedTextId(text.id);
      } else if (!isMultiSelected && selectedTextId !== text.id) {
        clearAllSelections();
        setSelectedTextId(text.id);
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
          const postit = postits.find(p => p.id === id);
          if (postit) {
            initialPositions.postits[id] = { x: postit.x, y: postit.y };
          }
        });
        
        selectedElements.texts.forEach(id => {
          const t = texts.find(t => t.id === id);
          if (t) {
            initialPositions.texts[id] = { x: t.x, y: t.y };
          }
        });
      } else {
        // Just store this text's initial position for single-move
        const originalText = texts.find(t => t.id === text.id);
        initialPositions.texts[text.id] = { 
          x: originalText.x, 
          y: originalText.y 
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
          // Just move this text node for single-move
          const initial = initialPositions.texts[text.id];
          setTexts(items => 
            items.map(t => 
              t.id === text.id ? { 
                ...t, 
                x: initial.x + dx, 
                y: initial.y + dy 
              } : t
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

  // Handle resize start - text only needs horizontal resize
  const handleResizeStart = (e, direction) => {
    if (mode !== 'select') return;
    
    e.stopPropagation();
    
    const startX = e.clientX;
    
    const originalText = texts.find(t => t.id === text.id);
    const { x, width } = originalText;
    
    // Minimum width to maintain
    const minWidth = 30;
    
    const resizeHandler = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / transform.scale;
      
      let newX = x;
      let newWidth = width;
      
      // For text nodes, we primarily care about horizontal resizing
      // Only apply width changes for east/west directions
      if (direction.includes('e')) {
        newWidth = Math.max(width + dx, minWidth);
      }
      if (direction.includes('w')) {
        newX = Math.min(x + dx, x + width - minWidth);
        newWidth = Math.max(width - dx, minWidth);
      }
      
      setTexts(items => 
        items.map(t => 
          t.id === text.id ? { 
            ...t, 
            x: newX, 
            width: newWidth
          } : t
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

  // Handle text editing for text node
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    
    if (mode === 'select') {
      const newText = window.prompt('Edit text:', text.content);
      
      if (newText !== null) {
        if (newText.trim() === '') {
          // If text is empty, delete the text node
          setTexts(texts.filter(t => t.id !== text.id));
          setConnections(connections.filter(conn => 
            !(conn.from === text.id && conn.sourceType === 'text') && 
            !(conn.to === text.id && conn.targetType === 'text')
          ));
          
          // Remove from multi-selection if needed
          if (isMultiSelected) {
            setSelectedElements(prev => ({
              ...prev,
              texts: prev.texts.filter(id => id !== text.id)
            }));
          }
          
          if (selectedTextId === text.id) {
            setSelectedTextId(null);
          }
        } else {
          // Update with new text content
          setTexts(texts.map(t => 
            t.id === text.id ? { ...t, content: newText } : t
          ));
        }
      }
    }
  };

  return (
    <div
      className={`text-node ${selectedTextId === text.id ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''} ${mode === 'delete' ? 'deletable' : ''}`}
      style={{
        left: `${text.x}px`,
        top: `${text.y}px`,
        width: `${text.width}px`,
        minHeight: `${text.height}px`
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div className="text-content">
        {text.content}
      </div>
      
      {/* Show resize handles only when selected and in select mode
          For text, we only use east/west handles for width adjustment */}
      {(selectedTextId === text.id || isMultiSelected) && mode === 'select' && (
        <ResizeHandles 
          onResizeStart={handleResizeStart} 
          showCorners={false} // Only show east/west handles for text
        />
      )}
    </div>
  );
};

export default TextNode;