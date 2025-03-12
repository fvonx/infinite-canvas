import React from 'react';
import { useCanvasContext } from '../../context/CanvasContext';

const ControlPanel = () => {
  const { mode, setMode } = useCanvasContext();

  return (
    <div className="controls">
      <button
        className={mode === 'select' ? 'active' : ''}
        onClick={() => setMode('select')}
      >
        Select
      </button>
      <button
        className={mode === 'rectangle' ? 'active' : ''}
        onClick={() => setMode('rectangle')}
      >
        Box
      </button>
      <button
        className={mode === 'postit' ? 'active' : ''}
        onClick={() => setMode('postit')}
      >
        Post-it
      </button>
      <button
        className={mode === 'text' ? 'active' : ''}
        onClick={() => setMode('text')}
      >
        Text
      </button>
      <button
        className={mode === 'connect' ? 'active' : ''}
        onClick={() => setMode('connect')}
      >
        Connect
      </button>
      <button
        className={mode === 'delete' ? 'active' : ''}
        onClick={() => setMode('delete')}
      >
        Delete
      </button>
    </div>
  );
};

export default ControlPanel;