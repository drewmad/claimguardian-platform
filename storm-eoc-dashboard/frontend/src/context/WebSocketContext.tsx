import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface WebSocketContextProps {
  isConnected: boolean;
  lastMessage: MessageEvent | null;
}

const WebSocketContext = createContext<WebSocketContextProps | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode, url: string }> = ({ children, url }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      console.log('WebSocket Message Received');
      setLastMessage(event);
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      // Implement reconnection logic here if needed
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [url]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
