import React, { useEffect } from 'react';
import './App.css';
import InfiniteCanvas from './components/InfiniteCanvas/InfiniteCanvas';
import CanvasProvider from './context/CanvasProvider';

const App = () => {
  // Prevent browser zooming and navigation
  useEffect(() => {
    // Stop browser zooming with ctrl+wheel or pinch
    const preventZoom = (e) => {
      if (e.ctrlKey || (e.touches && e.touches.length > 1)) {
        e.preventDefault();
      }
    };

    // Prevent horizontal swipe from navigating browser history
    const preventNavigation = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 2) {
        e.preventDefault();
      }
    };

    // Add event listeners with passive: false to ensure preventDefault works
    document.addEventListener('wheel', preventZoom, { passive: false });
    document.addEventListener('wheel', preventNavigation, { passive: false });
    document.addEventListener('touchstart', preventZoom, { passive: false });
    
    // Block browser back/forward navigation
    const blockHistoryNavigation = () => {
      window.history.pushState(null, document.title, window.location.href);
    };
    
    // Set up an initial history state
    window.history.pushState(null, document.title, window.location.href);
    
    // Add listener for popstate (happens when browser back button is pressed)
    window.addEventListener('popstate', blockHistoryNavigation);
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('wheel', preventZoom);
      document.removeEventListener('wheel', preventNavigation);
      document.removeEventListener('touchstart', preventZoom);
      window.removeEventListener('popstate', blockHistoryNavigation);
    };
  }, []);

  return (
    <CanvasProvider>
      <InfiniteCanvas />
    </CanvasProvider>
  );
};

export default App;