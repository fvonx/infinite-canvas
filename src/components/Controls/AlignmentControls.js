import React from 'react';
import { useCanvasContext } from '../../context/CanvasContext';

const AlignmentControls = () => {
  const { 
    mode,
    rectangles, 
    postits, 
    texts,
    connections,
    selectedElements,
    selectedRectId,
    selectedPostitId,
    setRectangles,
    setPostits,
    setTexts,
    setConnections
  } = useCanvasContext();

  // Calculate total number of selected elements
  const totalSelected = 
    selectedElements.rectangles.length + 
    selectedElements.postits.length + 
    selectedElements.texts.length +
    selectedElements.connections.length;
  
  // Check if exactly one connection is selected (for arrow controls)
  const hasExactlyOneConnection = selectedElements.connections.length === 1 && 
    selectedElements.rectangles.length === 0 && 
    selectedElements.postits.length === 0 && 
    selectedElements.texts.length === 0;
  
  // Get the selected connection if exactly one is selected
  const selectedConnection = hasExactlyOneConnection 
    ? connections.find(conn => conn.id === selectedElements.connections[0])
    : null;

  // Only show and enable alignment controls when in select mode and multiple elements are selected
  const showAlignmentControls = mode === 'select' && totalSelected > 1 &&
    (selectedElements.rectangles.length > 0 || 
     selectedElements.postits.length > 0 || 
     selectedElements.texts.length > 0);

  // Only show color controls when rectangle or post-it is selected
  const hasRectOrPostit = 
    selectedElements.rectangles.length > 0 || 
    selectedElements.postits.length > 0 || 
    selectedRectId || 
    selectedPostitId;

  // Define pastel color palette
  const colorPalette = [
    '#FFFFFF', // Default white
    '#FFD6E0', // Pastel pink
    '#FFEFB5', // Pastel yellow - matching post-it default color
    '#D1F0C2', // Pastel green
    '#B5DEFF', // Pastel blue
    '#E2CCFF'  // Pastel purple
  ];

  // Alignment functions
  const alignLeft = () => {
    // Find the leftmost element's x position
    let leftmost = Infinity;
    
    // Check rectangles
    selectedElements.rectangles.forEach(id => {
      const rect = rectangles.find(r => r.id === id);
      if (rect && rect.x < leftmost) {
        leftmost = rect.x;
      }
    });
    
    // Check post-its
    selectedElements.postits.forEach(id => {
      const postit = postits.find(p => p.id === id);
      if (postit && postit.x < leftmost) {
        leftmost = postit.x;
      }
    });
    
    // Check texts
    selectedElements.texts.forEach(id => {
      const text = texts.find(t => t.id === id);
      if (text && text.x < leftmost) {
        leftmost = text.x;
      }
    });
    
    // Align all selected elements to the leftmost x position
    if (leftmost !== Infinity) {
      // Update rectangles
      if (selectedElements.rectangles.length > 0) {
        setRectangles(prevRects => 
          prevRects.map(rect => 
            selectedElements.rectangles.includes(rect.id)
              ? { ...rect, x: leftmost }
              : rect
          )
        );
      }
      
      // Update post-its
      if (selectedElements.postits.length > 0) {
        setPostits(prevPostits => 
          prevPostits.map(postit => 
            selectedElements.postits.includes(postit.id)
              ? { ...postit, x: leftmost }
              : postit
          )
        );
      }
      
      // Update texts
      if (selectedElements.texts.length > 0) {
        setTexts(prevTexts => 
          prevTexts.map(text => 
            selectedElements.texts.includes(text.id)
              ? { ...text, x: leftmost }
              : text
          )
        );
      }
    }
  };

  const alignRight = () => {
    // Find the rightmost element's edge position
    let rightmost = -Infinity;
    let rightmostX = -Infinity;
    
    // Check rectangles
    selectedElements.rectangles.forEach(id => {
      const rect = rectangles.find(r => r.id === id);
      if (rect) {
        const edge = rect.x + rect.width;
        if (edge > rightmost) {
          rightmost = edge;
          rightmostX = rect.x;
        }
      }
    });
    
    // Check post-its
    selectedElements.postits.forEach(id => {
      const postit = postits.find(p => p.id === id);
      if (postit) {
        const edge = postit.x + postit.width;
        if (edge > rightmost) {
          rightmost = edge;
          rightmostX = postit.x;
        }
      }
    });
    
    // Check texts
    selectedElements.texts.forEach(id => {
      const text = texts.find(t => t.id === id);
      if (text) {
        const edge = text.x + text.width;
        if (edge > rightmost) {
          rightmost = edge;
          rightmostX = text.x;
        }
      }
    });
    
    // Align all selected elements to the rightmost edge
    if (rightmost !== -Infinity) {
      // Update rectangles
      if (selectedElements.rectangles.length > 0) {
        setRectangles(prevRects => 
          prevRects.map(rect => {
            if (selectedElements.rectangles.includes(rect.id)) {
              const newX = rightmost - rect.width;
              return { ...rect, x: newX };
            }
            return rect;
          })
        );
      }
      
      // Update post-its
      if (selectedElements.postits.length > 0) {
        setPostits(prevPostits => 
          prevPostits.map(postit => {
            if (selectedElements.postits.includes(postit.id)) {
              const newX = rightmost - postit.width;
              return { ...postit, x: newX };
            }
            return postit;
          })
        );
      }
      
      // Update texts
      if (selectedElements.texts.length > 0) {
        setTexts(prevTexts => 
          prevTexts.map(text => {
            if (selectedElements.texts.includes(text.id)) {
              const newX = rightmost - text.width;
              return { ...text, x: newX };
            }
            return text;
          })
        );
      }
    }
  };

  const alignTop = () => {
    // Find the topmost element's y position
    let topmost = Infinity;
    
    // Check rectangles
    selectedElements.rectangles.forEach(id => {
      const rect = rectangles.find(r => r.id === id);
      if (rect && rect.y < topmost) {
        topmost = rect.y;
      }
    });
    
    // Check post-its
    selectedElements.postits.forEach(id => {
      const postit = postits.find(p => p.id === id);
      if (postit && postit.y < topmost) {
        topmost = postit.y;
      }
    });
    
    // Check texts
    selectedElements.texts.forEach(id => {
      const text = texts.find(t => t.id === id);
      if (text && text.y < topmost) {
        topmost = text.y;
      }
    });
    
    // Align all selected elements to the topmost y position
    if (topmost !== Infinity) {
      // Update rectangles
      if (selectedElements.rectangles.length > 0) {
        setRectangles(prevRects => 
          prevRects.map(rect => 
            selectedElements.rectangles.includes(rect.id)
              ? { ...rect, y: topmost }
              : rect
          )
        );
      }
      
      // Update post-its
      if (selectedElements.postits.length > 0) {
        setPostits(prevPostits => 
          prevPostits.map(postit => 
            selectedElements.postits.includes(postit.id)
              ? { ...postit, y: topmost }
              : postit
          )
        );
      }
      
      // Update texts
      if (selectedElements.texts.length > 0) {
        setTexts(prevTexts => 
          prevTexts.map(text => 
            selectedElements.texts.includes(text.id)
              ? { ...text, y: topmost }
              : text
          )
        );
      }
    }
  };

  const alignBottom = () => {
    // Find the bottommost element's edge position
    let bottommost = -Infinity;
    
    // Check rectangles
    selectedElements.rectangles.forEach(id => {
      const rect = rectangles.find(r => r.id === id);
      if (rect) {
        const edge = rect.y + rect.height;
        if (edge > bottommost) {
          bottommost = edge;
        }
      }
    });
    
    // Check post-its
    selectedElements.postits.forEach(id => {
      const postit = postits.find(p => p.id === id);
      if (postit) {
        const edge = postit.y + postit.height;
        if (edge > bottommost) {
          bottommost = edge;
        }
      }
    });
    
    // Check texts
    selectedElements.texts.forEach(id => {
      const text = texts.find(t => t.id === id);
      if (text) {
        const edge = text.y + text.height;
        if (edge > bottommost) {
          bottommost = edge;
        }
      }
    });
    
    // Align all selected elements to the bottommost edge
    if (bottommost !== -Infinity) {
      // Update rectangles
      if (selectedElements.rectangles.length > 0) {
        setRectangles(prevRects => 
          prevRects.map(rect => {
            if (selectedElements.rectangles.includes(rect.id)) {
              const newY = bottommost - rect.height;
              return { ...rect, y: newY };
            }
            return rect;
          })
        );
      }
      
      // Update post-its
      if (selectedElements.postits.length > 0) {
        setPostits(prevPostits => 
          prevPostits.map(postit => {
            if (selectedElements.postits.includes(postit.id)) {
              const newY = bottommost - postit.height;
              return { ...postit, y: newY };
            }
            return postit;
          })
        );
      }
      
      // Update texts
      if (selectedElements.texts.length > 0) {
        setTexts(prevTexts => 
          prevTexts.map(text => {
            if (selectedElements.texts.includes(text.id)) {
              const newY = bottommost - text.height;
              return { ...text, y: newY };
            }
            return text;
          })
        );
      }
    }
  };

  // Function to change background color of selected elements
  const changeBackgroundColor = (color) => {
    // Update rectangles
    if (selectedElements.rectangles.length > 0) {
      setRectangles(prevRects => 
        prevRects.map(rect => 
          selectedElements.rectangles.includes(rect.id)
            ? { ...rect, backgroundColor: color }
            : rect
        )
      );
    } else if (selectedRectId) {
      // Single rectangle selection
      setRectangles(prevRects => 
        prevRects.map(rect => 
          rect.id === selectedRectId
            ? { ...rect, backgroundColor: color }
            : rect
        )
      );
    }
    
    // Update post-its
    if (selectedElements.postits.length > 0) {
      setPostits(prevPostits => 
        prevPostits.map(postit => 
          selectedElements.postits.includes(postit.id)
            ? { ...postit, backgroundColor: color }
            : postit
        )
      );
    } else if (selectedPostitId) {
      // Single post-it selection
      setPostits(prevPostits => 
        prevPostits.map(postit => 
          postit.id === selectedPostitId
            ? { ...postit, backgroundColor: color }
            : postit
        )
      );
    }
  };

  // Toggle arrow functions
  const toggleStartArrow = () => {
    if (!selectedConnection) return;
    
    setConnections(prevConnections => 
      prevConnections.map(conn => {
        if (conn.id === selectedConnection.id) {
          return { 
            ...conn, 
            startArrow: conn.startArrow ? undefined : true 
          };
        }
        return conn;
      })
    );
  };
  
  const toggleEndArrow = () => {
    if (!selectedConnection) return;
    
    setConnections(prevConnections => 
      prevConnections.map(conn => {
        if (conn.id === selectedConnection.id) {
          return { 
            ...conn, 
            endArrow: conn.endArrow ? undefined : true 
          };
        }
        return conn;
      })
    );
  };

  // Determine whether the arrow buttons should be highlighted
  const hasStartArrow = selectedConnection?.startArrow;
  const hasEndArrow = selectedConnection?.endArrow;

  return (
    <div className="controls-container">
      {showAlignmentControls && (
        <div className="alignment-controls">
          <button onClick={alignLeft} title="Align Left">
            ⇐
          </button>
          <button onClick={alignTop} title="Align Top">
            ⇑
          </button>
          <button onClick={alignBottom} title="Align Bottom">
            ⇓
          </button>
          <button onClick={alignRight} title="Align Right">
            ⇒
          </button>
        </div>
      )}
      
      {hasExactlyOneConnection && (
        <div className="arrow-controls">
          <div className="arrow-label">Arrows:</div>
          <button 
            className={hasStartArrow ? 'active' : ''} 
            onClick={toggleStartArrow}
            title="Toggle Start Arrow"
          >
            ←
          </button>
          <button 
            className={hasEndArrow ? 'active' : ''} 
            onClick={toggleEndArrow}
            title="Toggle End Arrow"
          >
            →
          </button>
        </div>
      )}
      
      {hasRectOrPostit && (
        <div className="color-controls">
          <div className="color-label">Colors:</div>
          {colorPalette.map((color, index) => (
            <div 
              key={index}
              className="color-circle"
              style={{ 
                backgroundColor: color,
                border: color === '#FFFFFF' ? '1px solid #ccc' : 'none'
              }}
              onClick={() => changeBackgroundColor(color)}
              title={color === '#FFFFFF' ? 'Default' : `Color ${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AlignmentControls;