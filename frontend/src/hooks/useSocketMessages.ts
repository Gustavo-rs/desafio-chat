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
  
  // Track if this instance has already set up listeners to prevent duplicates
  const listenersSetupRef = useRef(false);

  // Normalizar mensagem
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

  // Enviar mensagem
  const sendMessage = useCallback((messageData: any) => {
    if (socket && isConnected) {
      socket.emit("send_message", messageData);
    }
  }, [socket, isConnected]);

  // Usar refs para callbacks para evitar dependências
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

  // Atualizar refs quando callbacks mudarem
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

  // Configurar listeners quando entrar numa sala
  useEffect(() => {
    if (!socket || !roomId || !isConnected) return;
    
    // Prevent duplicate setup in StrictMode
    if (listenersSetupRef.current) {
      console.log(`⚠️ Listeners already setup for room: ${roomId}, skipping...`);
      return;
    }

    console.log(`🔗 Setting up socket listeners for room: ${roomId}`, { socketId: socket.id });
    listenersSetupRef.current = true;

    // Entrar na sala e começar a visualizar
    joinRoom(roomId);
    startViewingRoom(roomId);

    // Listener para mensagens recebidas
    const handleReceiveMessage = (data: any) => {
      console.log("📨 Message received:", data);
      const { roomId: eventRoomId, message } = data;
      
      if (eventRoomId === roomId) {
        const normalizedMessage = normalizeMessage(message);
        callbacksRef.current.onMessageReceived(normalizedMessage);
      }
    };

    // Listener para mensagens deletadas
    const handleMessageDeleted = ({ messageId, message: updatedMessage }: any) => {
      console.log("🗑️ Message deleted:", messageId);
      const normalized = updatedMessage ? normalizeMessage(updatedMessage) : undefined;
      callbacksRef.current.onMessageDeleted(messageId, normalized);
    };

    // Listener para mensagens editadas
    const handleMessageUpdated = ({ messageId, content, message: updatedMessage }: any) => {
      console.log("✏️ Message updated:", messageId);
      const normalized = updatedMessage ? normalizeMessage(updatedMessage) : undefined;
      callbacksRef.current.onMessageUpdated(messageId, content, normalized);
    };

    // Listener para usuários online
    const handleRoomUsersUpdated = ({ roomId: updatedRoomId, users, count }: any) => {
      if (updatedRoomId === roomId) {
        console.log("👥 Room users updated:", users);
        callbacksRef.current.onRoomUsersUpdated(updatedRoomId, users, count);
      }
    };

    // Listener para usuário entrou na sala
    const handleUserJoined = ({ userId, username, roomId: joinedRoomId }: any) => {
      console.log("👋 User joined event received:", { userId, username, joinedRoomId, currentRoomId: roomId, currentUserId, socketId: socket.id });
      if (joinedRoomId === roomId && userId !== currentUserId) {
        console.log("✅ Processing user joined:", username);
        callbacksRef.current.onUserJoined(userId, username, joinedRoomId);
      } else {
        console.log("❌ Ignoring user joined event:", { reason: joinedRoomId !== roomId ? 'different room' : 'same user' });
      }
    };

    // Listener para usuário saiu da sala
    const handleUserLeft = ({ userId, username, roomId: leftRoomId }: any) => {
      console.log("👋 User left event received:", { userId, username, leftRoomId, currentRoomId: roomId, currentUserId, socketId: socket.id });
      if (leftRoomId === roomId && userId !== currentUserId) {
        console.log("✅ Processing user left:", username);
        callbacksRef.current.onUserLeft(userId, username, leftRoomId);
      } else {
        console.log("❌ Ignoring user left event:", { reason: leftRoomId !== roomId ? 'different room' : 'same user' });
      }
    };

    // Listener para membro adicionado
    const handleMemberAdded = ({ roomId: eventRoomId, member }: any) => {
      if (eventRoomId === roomId) {
        console.log("➕ Member added:", member);
        callbacksRef.current.onMemberAdded(eventRoomId, member);
      }
    };

    // Listener para membro removido
    const handleMemberRemoved = ({ roomId: eventRoomId, removedUserId }: any) => {
      if (eventRoomId === roomId) {
        console.log("➖ Member removed:", removedUserId);
        callbacksRef.current.onMemberRemoved(eventRoomId, removedUserId);
      }
    };

    // Registrar todos os listeners
    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("room_users_updated", handleRoomUsersUpdated);
    socket.on("user_joined_room", handleUserJoined);
    socket.on("user_left_room", handleUserLeft);
    socket.on("member_added", handleMemberAdded);
    socket.on("member_removed", handleMemberRemoved);

    // Cleanup quando sair da sala
    return () => {
      console.log(`🔗 Cleaning up socket listeners for room: ${roomId}`, { socketId: socket?.id });
      
      // Reset the setup flag
      listenersSetupRef.current = false;
      
      // Sair da sala e parar de visualizar
      leaveRoom(roomId);
      stopViewingRoom(roomId);

      // Remover todos os listeners
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