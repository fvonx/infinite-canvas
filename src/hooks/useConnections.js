import { useState, useCallback } from 'react';

/**
 * Custom hook to manage connections between canvas elements
 */
const useConnections = () => {
  const [connections, setConnections] = useState([]);
  const [startConnection, setStartConnection] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  const [connectionSource, setConnectionSource] = useState(null);

  // Create a new connection
  const createConnection = useCallback((fromId, fromType, toId, toType) => {
    const newConnection = {
      id: Date.now(),
      from: fromId,
      to: toId,
      sourceType: fromType,
      targetType: toType
    };
    
    setConnections(prevConnections => [...prevConnections, newConnection]);
    return newConnection;
  }, []);

  // Delete a connection
  const deleteConnection = useCallback((id) => {
    setConnections(prevConnections => prevConnections.filter(conn => conn.id !== id));
  }, []);

  // Delete all connections related to an element
  const deleteConnectionsForElement = useCallback((elementId, elementType) => {
    setConnections(prevConnections => 
      prevConnections.filter(conn => 
        !(conn.from === elementId && conn.sourceType === elementType) && 
        !(conn.to === elementId && conn.targetType === elementType)
      )
    );
  }, []);

  // Start a new connection from a source element
  const startNewConnection = useCallback((elementId, elementType) => {
    setStartConnection({
      id: elementId,
      type: elementType
    });
    setConnectionSource(elementType);
    setTempConnection(null);
  }, []);

  // Update the temporary connection while drawing
  const updateTempConnection = useCallback((mouseX, mouseY) => {
    if (startConnection) {
      setTempConnection({
        from: startConnection,
        to: { id: 'temp', x: mouseX, y: mouseY, width: 10, height: 10 }
      });
    }
  }, [startConnection]);

  // Complete a connection to a target element
  const completeConnection = useCallback((targetId, targetType) => {
    if (startConnection) {
      const newConnection = {
        id: Date.now(),
        from: startConnection.id,
        to: targetId,
        sourceType: startConnection.type,
        targetType: targetType
      };
      
      setConnections(prevConnections => [...prevConnections, newConnection]);
      setStartConnection(null);
      setTempConnection(null);
      setConnectionSource(null);
      
      return newConnection;
    }
    return null;
  }, [startConnection]);

  // Cancel the current connection drawing
  const cancelConnection = useCallback(() => {
    setStartConnection(null);
    setTempConnection(null);
    setConnectionSource(null);
  }, []);

  return {
    connections,
    setConnections,
    startConnection,
    setStartConnection,
    tempConnection,
    setTempConnection,
    connectionSource,
    setConnectionSource,
    createConnection,
    deleteConnection,
    deleteConnectionsForElement,
    startNewConnection,
    updateTempConnection,
    completeConnection,
    cancelConnection
  };
};

export default useConnections;