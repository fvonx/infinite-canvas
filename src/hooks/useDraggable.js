import { useEffect } from 'react';
import { useCanvasContext } from '../context/CanvasContext';

/**
 * Custom hook to manage draggable and selectable behavior for canvas elements
 * 
 * @param {Object} props Configuration options
 * @param {Object} props.element The element data (rectangle, postit, text)
 * @param {string} props.elementType Type of the element ('rectangle', 'postit', 'text')
 * @param {boolean} props.isMultiSelected Whether the element is part of multi-selection
 * @param {string|null} props.selectedId Currently selected element ID for this type
 * @param {Function} props.setElements setState function for this element type
 * @param {Function} props.setSelectedId setState function for setting the selected ID
 * @returns {Object} Event handlers and state for the element
 */
const useDraggable = ({
  element,
  elementType,
  isMultiSelected,
  selectedId,
  setElements,
  setSelectedId
}) => {
  const {
    mode,
    transform,
    rectangles,
    postits,
    texts,
    connections,
    setRectangles,
    setPostits,
    setTexts,
    setConnections,
    setStartConnection,
    setConnectionSource,
    setMode,
    selectedElements,
    setSelectedElements,
    clearAllSelections
  } = useCanvasContext();

  // Element specific getters and setters
  const getElementSetter = () => {
    switch (elementType) {
      case 'rectangle': return setRectangles;
      case 'postit': return setPostits;
      case 'text': return setTexts;
      default: return null;
    }
  };

  const getElementList = () => {
    switch (elementType) {
      case 'rectangle': return rectangles;
      case 'postit': return postits;
      case 'text': return texts;
      default: return [];
    }
  };

  const getSelectedElementKey = () => {
    switch (elementType) {
      case 'rectangle': return 'rectangles';
      case 'postit': return 'postits';
      case 'text': return 'texts';
      default: return '';
    }
  };

  // Click handler
  const handleClick = (e) => {
    e.stopPropagation();
    
    if (mode === 'delete') {
      // Delete the element and its connections
      setElements(elements => elements.filter(el => el.id !== element.id));
      setConnections(connections.filter(conn => 
        !(conn.from === element.id && conn.sourceType === elementType) && 
        !(conn.to === element.id && conn.targetType === elementType)
      ));
      
      // Remove from selected elements if it's part of a multi-selection
      if (isMultiSelected) {
        setSelectedElements(prev => ({
          ...prev,
          [getSelectedElementKey()]: prev[getSelectedElementKey()].filter(id => id !== element.id)
        }));
      }
      
      if (selectedId === element.id) {
        setSelectedId(null);
      }
      
      // Switch back to select mode after deletion
      setMode('select');
    } else if (mode === 'connect') {
      // Start a new connection from this element
      setStartConnection({
        id: element.id,
        type: elementType
      });
      setConnectionSource(elementType);
    } else if (mode === 'select') {
      // In select mode, handle selection behavior
      
      if (e.shiftKey) {
        // Shift+click for toggling selection
        if (isMultiSelected) {
          // If already in multi-selection, remove it
          setSelectedElements(prev => ({
            ...prev,
            [getSelectedElementKey()]: prev[getSelectedElementKey()].filter(id => id !== element.id)
          }));
        } else {
          // Add to multi-selection - preserve existing selections
          setSelectedElements(prev => ({
            ...prev,
            [getSelectedElementKey()]: [...prev[getSelectedElementKey()], element.id]
          }));
          
          // Clear the individual selection to avoid conflicts
          if (selectedId === element.id) {
            setSelectedId(null);
          }
        }
      } else {
        // Regular click - select only this element
        clearAllSelections();
        setSelectedId(element.id);
      }
    }
  };

  // Mouse down handler for dragging
  const handleMouseDown = (e) => {
    if (mode === 'select') {
      e.stopPropagation();
      
      let wasDragged = false;
      
      // Create and dispatch a custom event to notify about element dragging
      const dragStartEvent = new CustomEvent('element-drag-start', { 
        detail: { 
          isMultiSelected,
          elementType,
          elementId: element.id
        }
      });
      document.dispatchEvent(dragStartEvent);
      
      // If this element is not already selected and not part of a multi-selection,
      // select it on mouse down unless shift is pressed
      if (!isMultiSelected && selectedId !== element.id && !e.shiftKey) {
        clearAllSelections();
        setSelectedId(element.id);
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
          const textEl = texts.find(t => t.id === id);
          if (textEl) {
            initialPositions.texts[id] = { x: textEl.x, y: textEl.y };
          }
        });
      } else {
        // Just store this element's initial position for single-move
        const originalElement = getElementList().find(el => el.id === element.id);
        initialPositions[getSelectedElementKey()][element.id] = { 
          x: originalElement.x, 
          y: originalElement.y 
        };
      }
      
      const moveHandler = (moveEvent) => {
        wasDragged = true;
        
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
          // Just move this element for single-move
          const elementSetter = getElementSetter();
          const selectedKey = getSelectedElementKey();
          const initial = initialPositions[selectedKey][element.id];
          
          elementSetter(items => 
            items.map(item => 
              item.id === element.id ? { 
                ...item, 
                x: initial.x + dx, 
                y: initial.y + dy 
              } : item
            )
          );
        }
      };
      
      const upHandler = (upEvent) => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', upHandler);
        
        // If the element was dragged and is part of a multi-selection,
        // dispatch event to indicate dragging is complete but selection should be preserved
        if (wasDragged) {
          const dragEndEvent = new CustomEvent('element-drag-end', { 
            detail: { 
              preserveSelection: true,
              isMultiSelected,
              elementType,
              elementId: element.id
            }
          });
          document.dispatchEvent(dragEndEvent);
          
          // Prevent click handler from firing after drag
          upEvent.stopPropagation();
        }
      };
      
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', upHandler);
    }
  };

  // Handle resize start - customizable per element type
  const handleResizeStart = (e, direction, resizeOptions = {}) => {
    if (mode !== 'select') return;
    
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    // Get original element
    const originalElement = getElementList().find(el => el.id === element.id);
    const { x, y, width, height } = originalElement;
    
    // Get minimum dimensions from options or use defaults
    const minWidth = resizeOptions.minWidth || 50;
    const minHeight = resizeOptions.minHeight || 40;
    const horizontalOnly = resizeOptions.horizontalOnly || false;
    
    // Create and dispatch a custom event to notify about element dragging
    const dragStartEvent = new CustomEvent('element-drag-start', { 
      detail: { 
        isMultiSelected,
        elementType,
        elementId: element.id,
        isResize: true
      }
    });
    document.dispatchEvent(dragStartEvent);
    
    const resizeHandler = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / transform.scale;
      const dy = (moveEvent.clientY - startY) / transform.scale;
      
      let newX = x;
      let newY = y;
      let newWidth = width;
      let newHeight = height;
      
      // Apply changes based on resize direction
      if (!horizontalOnly && direction.includes('n')) {
        newY = Math.min(y + dy, y + height - minHeight);
        newHeight = Math.max(height - dy, minHeight);
      }
      if (direction.includes('e')) {
        newWidth = Math.max(width + dx, minWidth);
      }
      if (!horizontalOnly && direction.includes('s')) {
        newHeight = Math.max(height + dy, minHeight);
      }
      if (direction.includes('w')) {
        newX = Math.min(x + dx, x + width - minWidth);
        newWidth = Math.max(width - dx, minWidth);
      }
      
      // Update the element with new dimensions
      const elementSetter = getElementSetter();
      
      elementSetter(items => 
        items.map(item => 
          item.id === element.id ? { 
            ...item, 
            x: newX, 
            y: newY, 
            width: newWidth, 
            height: horizontalOnly ? item.height : newHeight 
          } : item
        )
      );
    };
    
    const upHandler = () => {
      window.removeEventListener('mousemove', resizeHandler);
      window.removeEventListener('mouseup', upHandler);
      
      // If is part of a multi-selection, dispatch event to preserve selection
      if (isMultiSelected) {
        const dragEndEvent = new CustomEvent('element-drag-end', { 
          detail: { 
            preserveSelection: true,
            isMultiSelected,
            elementType,
            elementId: element.id
          }
        });
        document.dispatchEvent(dragEndEvent);
      }
    };
    
    window.addEventListener('mousemove', resizeHandler);
    window.addEventListener('mouseup', upHandler);
  };

  return {
    handleClick,
    handleMouseDown,
    handleResizeStart
  };
};

export default useDraggable;