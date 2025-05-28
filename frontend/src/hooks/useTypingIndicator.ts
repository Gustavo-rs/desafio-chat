import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface TypingUser {
  userId: string;
  username: string;
}

interface UseTypingIndicatorProps {
  roomId: string | undefined;
  currentUserId: string | undefined;
}

export const useTypingIndicator = ({ roomId, currentUserId }: UseTypingIndicatorProps) => {
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const userTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startTyping = useCallback(() => {
    if (!socket || !isConnected || !roomId || !currentUserId) return;

    if (!isTypingRef.current) {
      socket.emit('start_typing', { roomId, userId: currentUserId });
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [socket, isConnected, roomId, currentUserId]);

  const stopTyping = useCallback(() => {
    if (!socket || !isConnected || !roomId || !currentUserId) return;

    if (isTypingRef.current) {
      socket.emit('stop_typing', { roomId, userId: currentUserId });
      isTypingRef.current = false;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, isConnected, roomId, currentUserId]);

  const handleTyping = useCallback(() => {
    startTyping();
  }, [startTyping]);

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleUserStartTyping = ({ roomId: eventRoomId, userId, username }: any) => {
      if (eventRoomId === roomId && userId !== currentUserId) {
        const existingTimeout = userTimeoutsRef.current.get(userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        const userTimeout = setTimeout(() => {
          setTypingUsers(prev => prev.filter(user => user.userId !== userId));
          userTimeoutsRef.current.delete(userId);
        }, 5000);

        userTimeoutsRef.current.set(userId, userTimeout);

        setTypingUsers(prev => {
          const exists = prev.find(user => user.userId === userId);
          if (!exists) {
            return [...prev, { userId, username }];
          }
          return prev;
        });
      }
    };

    const handleUserStopTyping = ({ roomId: eventRoomId, userId }: any) => {
      if (eventRoomId === roomId) {
        const userTimeout = userTimeoutsRef.current.get(userId);
        if (userTimeout) {
          clearTimeout(userTimeout);
          userTimeoutsRef.current.delete(userId);
        }

        setTypingUsers(prev => prev.filter(user => user.userId !== userId));
      }
    };

    socket.on('user_start_typing', handleUserStartTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('user_start_typing', handleUserStartTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, roomId, currentUserId]);

  useEffect(() => {
    setTypingUsers([]);
    stopTyping();
    
    userTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    userTimeoutsRef.current.clear();
  }, [roomId, stopTyping]);

  useEffect(() => {
    return () => {
      stopTyping();
      userTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      userTimeoutsRef.current.clear();
    };
  }, [stopTyping]);

  return {
    typingUsers,
    handleTyping,
    stopTyping
  };
};