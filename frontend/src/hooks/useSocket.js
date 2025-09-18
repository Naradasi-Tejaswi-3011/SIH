import React, { useEffect, useState, useContext, createContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Create socket connection with authentication
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: {
          token: localStorage.getItem('ayursutra_token'),
          userId: user.id,
          role: user.role,
        },
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Connected to server:', newSocket.id);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });

      // Authentication events
      newSocket.on('authenticated', (data) => {
        console.log('Socket authenticated:', data);
      });

      newSocket.on('unauthorized', (error) => {
        console.error('Socket unauthorized:', error);
        newSocket.disconnect();
      });

      setSocket(newSocket);

      // Cleanup on unmount or auth change
      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    } else {
      // Disconnect if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};
