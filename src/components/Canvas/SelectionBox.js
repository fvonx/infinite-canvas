import React from 'react';

/**
 * SelectionBox component - renders the rubber band selection area
 * @param {Object} props - Component props
 * @param {Object} props.selectionBox - Selection box coordinates
 * @param {number} props.selectionBox.startX - Start X coordinate
 * @param {number} props.selectionBox.startY - Start Y coordinate
 * @param {number} props.selectionBox.endX - End X coordinate
 * @param {number} props.selectionBox.endY - End Y coordinate
 */
const SelectionBox = ({ selectionBox }) => {
  if (!selectionBox) return null;
  
  const { startX, startY, endX, endY } = selectionBox;
  
  // Calculate the top-left corner and dimensions
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  
  return (
    <div 
      className="selection-box"
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: '1px dashed #4a90e2',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        pointerEvents: 'none',
        zIndex: 4
      }}
    />
  );
};

export default SelectionBox;