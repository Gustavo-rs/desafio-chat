import { useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "@/store/auth-store";
import { useSocketMessages } from "@/hooks/useSocketMessages";
import messageService from "@/services/message-service";
import type { Message, OnlineUser } from "@/types/api";

interface UseChatPageLogicProps {
  roomId: string;
}

export const useChatPageLogic = ({ roomId }: UseChatPageLogicProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [userRemovedFromRoom, setUserRemovedFromRoom] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isLoadingOlderMessages = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const normalizeMessage = (msg: any): Message => {
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
  };

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
    else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "auto"
      });
    }
  };

  // Callbacks para o hook de socket - usando useRef para evitar dependências
  const callbacksRef = useRef({
    handleMessageReceived: (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    },
    handleMessageDeleted: (messageId: string, updatedMessage?: Message) => {
      if (updatedMessage) {
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        ));
      }
    },
    handleMessageUpdated: (messageId: string, _content: string, updatedMessage?: Message) => {
      if (updatedMessage) {
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        ));
      }
    },
    handleUserJoined: (userId: string, username: string, _roomId: string) => {
      const systemMessage: Message = {
        id: `system-join-${Date.now()}-${userId}`,
        user: {
          id: 'system',
          username: 'Sistema'
        },
        content: `${username} entrou na sala`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'ACTIVE',
        isSystemMessage: true,
        systemMessageType: 'user_joined'
      };
      
      setMessages((prev) => [...prev, systemMessage]);
      scrollToBottom();
    },
    handleUserLeft: (userId: string, username: string, _roomId: string) => {
      setMessages((prev) => {
        const systemMessage: Message = {
          id: `system-leave-${Date.now()}-${userId}`,
          user: {
            id: 'system',
            username: 'Sistema'
          },
          content: `${username} saiu da sala`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'ACTIVE',
          isSystemMessage: true,
          systemMessageType: 'user_left'
        };
        
        return [...prev, systemMessage];
      });
      scrollToBottom();
    },
    handleMemberAdded: (_roomId: string, member: any) => {
      const systemMessage: Message = {
        id: `system-member-added-${Date.now()}-${member.user.id}`,
        user: {
          id: 'system',
          username: 'Sistema'
        },
        content: `${member.user.username} foi adicionado à sala`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'ACTIVE',
        isSystemMessage: true,
        systemMessageType: 'member_added'
      };
      
      setMessages((prev) => [...prev, systemMessage]);
      scrollToBottom();
    },
    handleMemberRemoved: (_roomId: string, removedUserId: string) => {
      // Se o usuário atual foi removido, não mostrar mais mensagens
      if (removedUserId === user?.user?.id) {
        console.log("ChatPage: Usuário atual foi removido da sala, limpando chat");
        setMessages([]);
        setUserRemovedFromRoom(true);
        return;
      }
      
      setMessages((prev) => {
        // Para outros usuários removidos, mostrar mensagem do sistema
        const removedUserMessage = prev.find(msg => msg.user.id === removedUserId);
        const removedUsername = removedUserMessage?.user.username || 'Usuário';
        
        const systemMessage: Message = {
          id: `system-member-removed-${Date.now()}-${removedUserId}`,
          user: {
            id: 'system',
            username: 'Sistema'
          },
          content: `${removedUsername} foi removido da sala`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'ACTIVE',
          isSystemMessage: true,
          systemMessageType: 'member_removed'
        };
        
        return [...prev, systemMessage];
      });
      scrollToBottom();
    },
    handleRoomUsersUpdated: (_roomId: string, users: any[], _count: number) => {
      setOnlineUsers(users);
      setLoadingUsers(false);
    }
  });

  // Callbacks estáveis para o hook
  const handleMessageReceived = useCallback((message: Message) => {
    callbacksRef.current.handleMessageReceived(message);
  }, []);

  const handleMessageDeleted = useCallback((messageId: string, updatedMessage?: Message) => {
    callbacksRef.current.handleMessageDeleted(messageId, updatedMessage);
  }, []);

  const handleMessageUpdated = useCallback((messageId: string, content: string, updatedMessage?: Message) => {
    callbacksRef.current.handleMessageUpdated(messageId, content, updatedMessage);
  }, []);

  const handleUserJoined = useCallback((userId: string, username: string, roomId: string) => {
    callbacksRef.current.handleUserJoined(userId, username, roomId);
  }, []);

  const handleUserLeft = useCallback((userId: string, username: string, roomId: string) => {
    callbacksRef.current.handleUserLeft(userId, username, roomId);
  }, []);

  const handleMemberAdded = useCallback((roomId: string, member: any) => {
    callbacksRef.current.handleMemberAdded(roomId, member);
  }, []);

  const handleMemberRemoved = useCallback((roomId: string, removedUserId: string) => {
    callbacksRef.current.handleMemberRemoved(roomId, removedUserId);
  }, []);

  const handleRoomUsersUpdated = useCallback((roomId: string, users: any[], count: number) => {
    callbacksRef.current.handleRoomUsersUpdated(roomId, users, count);
  }, []);

  // Use the custom hook for socket management
  useSocketMessages({
    roomId,
    currentUserId: user?.user?.id,
    onMessageReceived: handleMessageReceived,
    onMessageDeleted: handleMessageDeleted,
    onMessageUpdated: handleMessageUpdated,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onMemberAdded: handleMemberAdded,
    onMemberRemoved: handleMemberRemoved,
    onRoomUsersUpdated: handleRoomUsersUpdated,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && selectedFiles.length === 0) return;

    try {
      const formData = new FormData();
      formData.append('content', input);
      formData.append('roomId', roomId);

      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      await messageService.createMessage(formData);
      setInput("");
      clearAllFiles();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      await messageService.deleteMessage(messageToDelete);
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    } catch (error) {
      console.error("Erro ao deletar mensagem:", error);
    }
  };

  const cancelDeleteMessage = () => {
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return;

    try {
      await messageService.updateMessage(messageId, editingContent);
      setEditingMessageId(null);
      setEditingContent("");
    } catch (error) {
      console.error("Erro ao editar mensagem:", error);
    }
  };

  const startEditing = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditingContent(currentContent);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const listMessagesFromRoom = async (pageNumber = 1) => {
    if (!roomId) return;

    setLoading(true);
    isLoadingOlderMessages.current = true;

    try {
      const response = await messageService.listMessagesFromRoom(roomId, pageNumber);
      
      if (pageNumber === 1) {
        const normalizedMessages = response.data.messages.map(normalizeMessage);
        setMessages(normalizedMessages);
        setInitialLoadDone(true);
        
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        const normalizedMessages = response.data.messages.map(normalizeMessage);
        setMessages(prev => [...normalizedMessages, ...prev]);
        
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            container.scrollTop = scrollHeight - clientHeight - 100;
          }
        }, 100);
      }

      setHasMore(response.data.currentPage < response.data.pages);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current || loading || !hasMore) return;

    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop === 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      listMessagesFromRoom(nextPage);
    }
  };

  useEffect(() => {
    if (roomId) {
      setMessages([]);
      setPage(1);
      setHasMore(true);
      setInitialLoadDone(false);
      setUserRemovedFromRoom(false);
      listMessagesFromRoom(1);
    }
  }, [roomId]);

  return {
    // State
    messages,
    input,
    selectedFiles,
    page,
    hasMore,
    loading,
    initialLoadDone,
    editingMessageId,
    editingContent,
    deleteDialogOpen,
    messageToDelete,
    userRemovedFromRoom,
    onlineUsers,
    showOnlineUsers,
    loadingUsers,
    user,

    // Refs
    fileInputRef,
    messagesContainerRef,
    bottomRef,

    // Setters
    setInput,
    setEditingContent,
    setMessageToDelete,
    setDeleteDialogOpen,
    setShowOnlineUsers,

    // Handlers
    handleFileSelect,
    removeSelectedFile,
    clearAllFiles,
    sendMessage,
    handleDeleteMessage,
    confirmDeleteMessage,
    cancelDeleteMessage,
    handleEditMessage,
    startEditing,
    cancelEditing,
    handleScroll,
  };
}; 