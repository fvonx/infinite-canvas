import React from 'react';
import { getEdgeMidpoints } from '../../utils/connectionUtils';

/**
 * Renders anchor points around a canvas element for connection snapping
 * @param {Object} props - Component props
 * @param {Object} props.element - The element to show anchor points for
 * @param {string} props.type - Element type (rectangle, postit, or text)
 * @param {string|null} props.activeAnchor - The currently active anchor point (top, right, bottom, left)
 */
const AnchorPoints = ({ element, type, activeAnchor }) => {
  // Calculate edge midpoint positions
  const edgePoints = getEdgeMidpoints(element);
  
  // Anchor point size
  const anchorSize = 10;
  
  return (
    <>
      {Object.entries(edgePoints).map(([side, point]) => (
        <div
          key={side}
          className={`anchor-point ${side} ${activeAnchor === side ? 'active' : ''}`}
          style={{
            position: 'absolute',
            left: `${point.x - anchorSize / 2}px`,
            top: `${point.y - anchorSize / 2}px`,
            width: `${anchorSize}px`,
            height: `${anchorSize}px`,
            borderRadius: '50%',
            backgroundColor: activeAnchor === side ? '#ff6b6b' : '#4a90e2',
            border: '2px solid white',
            boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)',
            zIndex: 5,
            transition: 'transform 0.1s ease, background-color 0.1s ease'
          }}
        />
      ))}
    </>
  );
};

export default AnchorPoints;