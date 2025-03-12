import React from 'react';

const ResizeHandles = ({ onResizeStart, showCorners = true }) => {
  // Handle mousedown on resize handles
  const handleMouseDown = (e, direction) => {
    e.stopPropagation();
    onResizeStart(e, direction);
  };

  return (
    <>
      {/* North (top) */}
      <div 
        className="resize-handle n" 
        onMouseDown={(e) => handleMouseDown(e, 'n')}
      />
      
      {/* East (right) */}
      <div 
        className="resize-handle e" 
        onMouseDown={(e) => handleMouseDown(e, 'e')}
      />
      
      {/* South (bottom) */}
      <div 
        className="resize-handle s" 
        onMouseDown={(e) => handleMouseDown(e, 's')}
      />
      
      {/* West (left) */}
      <div 
        className="resize-handle w" 
        onMouseDown={(e) => handleMouseDown(e, 'w')}
      />
      
      {/* Corners (optional) */}
      {showCorners && (
        <>
          {/* Northeast */}
          <div 
            className="resize-handle ne" 
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          
          {/* Southeast */}
          <div 
            className="resize-handle se" 
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />
          
          {/* Southwest */}
          <div 
            className="resize-handle sw" 
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          
          {/* Northwest */}
          <div 
            className="resize-handle nw" 
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
        </>
      )}
    </>
  );
};

export default ResizeHandles;