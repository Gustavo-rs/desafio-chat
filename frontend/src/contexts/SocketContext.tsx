import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  startViewingRoom: (roomId: string) => void;
  stopViewingRoom: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinRoom = useCallback((roomId: string) => {
    if (socket && isConnected) {
      socket.emit("join_room", roomId);
    }
  }, [socket, isConnected]);

  const leaveRoom = useCallback((roomId: string) => {
    if (socket && isConnected) {
      socket.emit("leave_room", roomId);
    }
  }, [socket, isConnected]);

  const startViewingRoom = useCallback((roomId: string) => {
    if (socket && isConnected) {
      socket.emit("start_viewing_room", roomId);
    }
  }, [socket, isConnected]);

  const stopViewingRoom = useCallback((roomId: string) => {
    if (socket && isConnected) {
      socket.emit("stop_viewing_room", roomId);
    }
  }, [socket, isConnected]);

  useEffect(() => {
    setIsConnecting(true);
    setError(null);

    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      setIsConnecting(false);
      if (reason === "io server disconnect") {
        newSocket.connect();
      }
    });

    newSocket.on("connect_error", (error) => {
      setIsConnected(false);
      setIsConnecting(false);
      setError(error.message);
    });

    newSocket.on("reconnect", () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    newSocket.on("reconnect_attempt", () => {
      setIsConnecting(true);
    });

    newSocket.on("reconnect_error", (error) => {
      setError(error.message);
    });

    newSocket.on("reconnect_failed", () => {
      setIsConnecting(false);
      setError("Failed to reconnect to server");
    });

    setSocket(newSocket);

    return () => {
      newSocket.removeAllListeners();
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setIsConnecting(false);
      setError(null);
    };
  }, []);

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    isConnecting,
    error,
    joinRoom,
    leaveRoom,
    startViewingRoom,
    stopViewingRoom
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
