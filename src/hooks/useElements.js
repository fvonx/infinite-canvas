import { useState, useCallback } from 'react';

/**
 * Custom hook to manage canvas elements (rectangles, post-its, text nodes)
 */
const useElements = () => {
  const [rectangles, setRectangles] = useState([]);
  const [postits, setPostits] = useState([]);
  const [texts, setTexts] = useState([]);

  // Create a new rectangle
  const createRectangle = useCallback((x, y) => {
    const newRect = {
      id: Date.now(),
      x,
      y,
      width: 150,
      height: 80,
      content: 'New Box'
    };
    
    setRectangles(prevRects => [...prevRects, newRect]);
    return newRect;
  }, []);

  // Create a new post-it
  const createPostit = useCallback((x, y) => {
    const newPostit = {
      id: Date.now(),
      x,
      y,
      width: 150,
      height: 150,
      content: 'New Post-it'
    };
    
    setPostits(prevPostits => [...prevPostits, newPostit]);
    return newPostit;
  }, []);

  // Create a new text node
  const createText = useCallback((x, y, content) => {
    if (!content || content.trim() === '') return null;
    
    const newText = {
      id: Date.now(),
      x,
      y,
      width: 200,
      height: 30,
      content
    };
    
    setTexts(prevTexts => [...prevTexts, newText]);
    return newText;
  }, []);

  // Update element content
  const updateElementContent = useCallback((type, id, content) => {
    switch (type) {
      case 'rectangle':
        setRectangles(prevRects => 
          prevRects.map(r => r.id === id ? { ...r, content } : r)
        );
        break;
      case 'postit':
        setPostits(prevPostits => 
          prevPostits.map(p => p.id === id ? { ...p, content } : p)
        );
        break;
      case 'text':
        if (!content || content.trim() === '') {
          // Delete text node if content is empty
          setTexts(prevTexts => prevTexts.filter(t => t.id !== id));
          return null;
        } else {
          setTexts(prevTexts => 
            prevTexts.map(t => t.id === id ? { ...t, content } : t)
          );
        }
        break;
      default:
        console.error(`Unknown element type: ${type}`);
    }
  }, []);

  // Move an element
  const moveElement = useCallback((type, id, dx, dy) => {
    switch (type) {
      case 'rectangle':
        setRectangles(prevRects => 
          prevRects.map(r => r.id === id ? { ...r, x: r.x + dx, y: r.y + dy } : r)
        );
        break;
      case 'postit':
        setPostits(prevPostits => 
          prevPostits.map(p => p.id === id ? { ...p, x: p.x + dx, y: p.y + dy } : p)
        );
        break;
      case 'text':
        setTexts(prevTexts => 
          prevTexts.map(t => t.id === id ? { ...t, x: t.x + dx, y: t.y + dy } : t)
        );
        break;
      default:
        console.error(`Unknown element type: ${type}`);
    }
  }, []);

  // Delete an element
  const deleteElement = useCallback((type, id) => {
    switch (type) {
      case 'rectangle':
        setRectangles(prevRects => prevRects.filter(r => r.id !== id));
        break;
      case 'postit':
        setPostits(prevPostits => prevPostits.filter(p => p.id !== id));
        break;
      case 'text':
        setTexts(prevTexts => prevTexts.filter(t => t.id !== id));
        break;
      default:
        console.error(`Unknown element type: ${type}`);
    }
  }, []);
  
  // Find element by ID and type
  const findElementById = useCallback((type, id) => {
    switch (type) {
      case 'rectangle':
        return rectangles.find(r => r.id === id) || null;
      case 'postit':
        return postits.find(p => p.id === id) || null;
      case 'text':
        return texts.find(t => t.id === id) || null;
      default:
        console.error(`Unknown element type: ${type}`);
        return null;
    }
  }, [rectangles, postits, texts]);

  return {
    rectangles,
    setRectangles,
    postits,
    setPostits,
    texts,
    setTexts,
    createRectangle,
    createPostit,
    createText,
    updateElementContent,
    moveElement,
    deleteElement,
    findElementById
  };
};

export default useElements;