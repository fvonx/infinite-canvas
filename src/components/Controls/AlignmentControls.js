import React from 'react';
import { useCanvasContext } from '../../context/CanvasContext';

const AlignmentControls = () => {
  const { 
    mode,
    rectangles, 
    postits, 
    texts,
    selectedElements,
    setRectangles,
    setPostits,
    setTexts
  } = useCanvasContext();

  // Calculate total number of selected elements
  const totalSelected = 
    selectedElements.rectangles.length + 
    selectedElements.postits.length + 
    selectedElements.texts.length;
  
  // Only show and enable alignment controls when in select mode and multiple elements are selected
  const isVisible = mode === 'select' && totalSelected > 1;

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

  // If not visible, return null to not render anything
  if (!isVisible) {
    return null;
  }

  return (
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
  );
};

export default AlignmentControls;