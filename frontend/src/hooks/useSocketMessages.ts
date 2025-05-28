import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import type { Message } from '@/types/api';

interface UseSocketMessagesProps {
  roomId: string | undefined;
  currentUserId: string | undefined;
  onMessageReceived: (message: Message) => void;
  onMessageDeleted: (messageId: string, updatedMessage?: Message) => void;
  onMessageUpdated: (messageId: string, content: string, updatedMessage?: Message) => void;
  onUserJoined: (userId: string, username: string, roomId: string) => void;
  onUserLeft: (userId: string, username: string, roomId: string) => void;
  onMemberAdded: (roomId: string, member: any) => void;
  onMemberRemoved: (roomId: string, removedUserId: string) => void;
  onRoomUsersUpdated: (roomId: string, users: any[], count: number) => void;
}

export const useSocketMessages = ({
  roomId,
  currentUserId,
  onMessageReceived,
  onMessageDeleted,
  onMessageUpdated,
  onUserJoined,
  onUserLeft,
  onMemberAdded,
  onMemberRemoved,
  onRoomUsersUpdated
}: UseSocketMessagesProps) => {
  const { socket, isConnected, joinRoom, leaveRoom, startViewingRoom, stopViewingRoom } = useSocket();
  
  const listenersSetupRef = useRef(false);

  const normalizeMessage = useCallback((msg: any): Message => {
    return {
      id: msg.id,
      user: {
        id: msg.user.id,
        username: msg.user.username,
      },
      content: msg.content || "",
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      status: msg.status || 'ACTIVE',
      files: msg.files ? msg.files.map((file: any) => ({
        id: file.id,
        file_name: file.file_name,
        file_url: file.file_url,
        file_type: file.file_type,
        file_size: file.file_size,
        created_at: file.created_at,
      })) : [],
      isSystemMessage: msg.is_system_message,
      systemMessageType: msg.system_message_type,
    };
  }, []);

  const sendMessage = useCallback((messageData: any) => {
    if (socket && isConnected) {
      socket.emit("send_message", messageData);
    }
  }, [socket, isConnected]);

  const callbacksRef = useRef({
    onMessageReceived,
    onMessageDeleted,
    onMessageUpdated,
    onUserJoined,
    onUserLeft,
    onMemberAdded,
    onMemberRemoved,
    onRoomUsersUpdated
  });

  useEffect(() => {
    callbacksRef.current = {
      onMessageReceived,
      onMessageDeleted,
      onMessageUpdated,
      onUserJoined,
      onUserLeft,
      onMemberAdded,
      onMemberRemoved,
      onRoomUsersUpdated
    };
  });

  useEffect(() => {
    if (!socket || !roomId || !isConnected) return;
    
    if (listenersSetupRef.current) return;

    listenersSetupRef.current = true;

    joinRoom(roomId);
    startViewingRoom(roomId);

    const handleReceiveMessage = (data: any) => {
      const { roomId: eventRoomId, message } = data;
      
      if (eventRoomId === roomId) {
        const normalizedMessage = normalizeMessage(message);
        callbacksRef.current.onMessageReceived(normalizedMessage);
      }
    };

    const handleMessageDeleted = ({ messageId, message: updatedMessage }: any) => {
      const normalized = updatedMessage ? normalizeMessage(updatedMessage) : undefined;
      callbacksRef.current.onMessageDeleted(messageId, normalized);
    };

    const handleMessageUpdated = ({ messageId, content, message: updatedMessage }: any) => {
      const normalized = updatedMessage ? normalizeMessage(updatedMessage) : undefined;
      callbacksRef.current.onMessageUpdated(messageId, content, normalized);
    };

    const handleRoomUsersUpdated = ({ roomId: updatedRoomId, users, count }: any) => {
      if (updatedRoomId === roomId) {
        callbacksRef.current.onRoomUsersUpdated(updatedRoomId, users, count);
      }
    };

    const handleUserJoined = ({ userId, username, roomId: joinedRoomId }: any) => {
      if (joinedRoomId === roomId && userId !== currentUserId) {
        callbacksRef.current.onUserJoined(userId, username, joinedRoomId);
      }
    };

    const handleUserLeft = ({ userId, username, roomId: leftRoomId }: any) => {
      if (leftRoomId === roomId && userId !== currentUserId) {
        callbacksRef.current.onUserLeft(userId, username, leftRoomId);
      }
    };

    const handleMemberAdded = ({ roomId: eventRoomId, member }: any) => {
      if (eventRoomId === roomId) {
        callbacksRef.current.onMemberAdded(eventRoomId, member);
      }
    };

    const handleMemberRemoved = ({ roomId: eventRoomId, removedUserId }: any) => {
      if (eventRoomId === roomId) {
        callbacksRef.current.onMemberRemoved(eventRoomId, removedUserId);
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("room_users_updated", handleRoomUsersUpdated);
    socket.on("user_joined_room", handleUserJoined);
    socket.on("user_left_room", handleUserLeft);
    socket.on("member_added", handleMemberAdded);
    socket.on("member_removed", handleMemberRemoved);

    return () => {
      listenersSetupRef.current = false;
      
      leaveRoom(roomId);
      stopViewingRoom(roomId);

      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_updated", handleMessageUpdated);
      socket.off("room_users_updated", handleRoomUsersUpdated);
      socket.off("user_joined_room", handleUserJoined);
      socket.off("user_left_room", handleUserLeft);
      socket.off("member_added", handleMemberAdded);
      socket.off("member_removed", handleMemberRemoved);
    };
  }, [
    socket,
    roomId,
    isConnected,
    currentUserId,
    joinRoom,
    leaveRoom,
    startViewingRoom,
    stopViewingRoom,
    normalizeMessage
  ]);

  return {
    sendMessage,
    isConnected
  };
};