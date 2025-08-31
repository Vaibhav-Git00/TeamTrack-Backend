import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [joinedTeams, setJoinedTeams] = useState(new Set());
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);

        // Auto-join user's teams for notifications
        if (user?.teams) {
          user.teams.forEach(team => {
            const teamId = typeof team === 'string' ? team : team._id;
            newSocket.emit('join-team', teamId);
            setJoinedTeams(prev => new Set([...prev, teamId]));
          });
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user, token]);

  // Socket event handlers
  const joinTeam = (teamId) => {
    if (socket && isConnected && !joinedTeams.has(teamId)) {
      socket.emit('join-team', teamId);
      setJoinedTeams(prev => new Set([...prev, teamId]));
    }
  };

  const leaveTeam = (teamId) => {
    if (socket && isConnected) {
      socket.emit('leave-team', teamId);
      setJoinedTeams(prev => {
        const newSet = new Set(prev);
        newSet.delete(teamId);
        return newSet;
      });
    }
  };

  const sendMessage = (teamId, message) => {
    if (socket && isConnected) {
      socket.emit('send-message', { teamId, message });
    }
  };

  const sendTyping = (teamId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { teamId, isTyping });
    }
  };

  // Event listeners
  const onNewMessage = (callback) => {
    if (socket) {
      socket.on('new-message', callback);
      return () => socket.off('new-message', callback);
    }
  };

  const onUserTyping = (callback) => {
    if (socket) {
      socket.on('user-typing', callback);
      return () => socket.off('user-typing', callback);
    }
  };

  const onMessageError = (callback) => {
    if (socket) {
      socket.on('message-error', callback);
      return () => socket.off('message-error', callback);
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    joinTeam,
    leaveTeam,
    sendMessage,
    sendTyping,
    onNewMessage,
    onUserTyping,
    onMessageError
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
