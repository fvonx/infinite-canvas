import React from 'react';
import { useCanvasContext } from '../../context/CanvasContext';
import CanvasContainer from '../Canvas/CanvasContainer';
import ControlPanel from '../Controls/ControlPanel';
import StorageControls from '../Controls/StorageControls';
import ZoomControls from '../Controls/ZoomControls';
import StatusBar from '../Controls/StatusBar';
import AlignmentControls from '../Controls/AlignmentControls';

const InfiniteCanvas = () => {
  return (
    <div className="app">
      <CanvasContainer />
      <ControlPanel />
      <StorageControls />
      <ZoomControls />
      <AlignmentControls />
      <StatusBar />
    </div>
  );
};

export default InfiniteCanvas;