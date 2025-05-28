import { useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "@/store/auth-store";
import { useSocketMessages } from "@/hooks/useSocketMessages";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import messageService from "@/services/message-service";
import type { Message, OnlineUser } from "@/types/api";
import { toast } from "sonner";

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
  const [deletingMessage, setDeletingMessage] = useState(false);
  const [editingMessage, setEditingMessage] = useState(false);
  const [userRemovedFromRoom, setUserRemovedFromRoom] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isLoadingOlderMessages = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);
  const lastScrollTop = useRef(0);
  const { user } = useUser();

  const { typingUsers, handleTyping, stopTyping } = useTypingIndicator({
    roomId,
    currentUserId: user?.user?.id
  });

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

  const scrollToBottom = (instant = false, force = false) => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    
    if (!force && userScrolledUp.current && !isNearBottom) {
      return;
    }
    
    if (!instant && isNearBottom) return;

    const performScroll = () => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "auto" });
      } else if (container) {
        container.scrollTo({
          top: container.scrollHeight,
        behavior: "auto"
      });
    }
      userScrolledUp.current = false;
      lastScrollTop.current = container.scrollTop;
    };

    performScroll();
    
    if (instant) {
      setTimeout(performScroll, 30);
    }
  };

  const handleImageLoad = useCallback(() => {
    if (!isLoadingOlderMessages.current && !userScrolledUp.current) {
      setTimeout(() => scrollToBottom(true), 30);
    }
  }, []);

  const callbacksRef = useRef({
    handleMessageReceived: (message: Message) => {
      setMessages((prev) => [...prev, message]);
      if (!userScrolledUp.current) {
        setTimeout(() => scrollToBottom(true), 30);
      }
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
      if (!userScrolledUp.current) {
        setTimeout(() => scrollToBottom(true), 50);
      }
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
      if (!userScrolledUp.current) {
        setTimeout(() => scrollToBottom(true), 50);
      }
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
      if (!userScrolledUp.current) {
        setTimeout(() => scrollToBottom(true), 50);
      }
    },
    handleMemberRemoved: (_roomId: string, removedUserId: string) => {
      if (removedUserId === user?.user?.id) {
        setMessages([]);
        setUserRemovedFromRoom(true);
        return;
      }
      
      setMessages((prev) => {
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
      if (!userScrolledUp.current) {
        setTimeout(() => scrollToBottom(true), 50);
      }
    },
    handleRoomUsersUpdated: (_roomId: string, users: any[], _count: number) => {
      setOnlineUsers(users);
      setLoadingUsers(false);
    }
  });

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
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    setDeletingMessage(true);
    try {
      await messageService.deleteMessage(messageToDelete);
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    } catch (error) {
      toast.error("Erro ao deletar mensagem");
    } finally {
      setDeletingMessage(false);
    }
  };

  const cancelDeleteMessage = () => {
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return;

    setEditingMessage(true);
    try {
      await messageService.updateMessage(messageId, editingContent);
      setEditingMessageId(null);
      setEditingContent("");
    } catch (error) {
      toast.error("Erro ao editar mensagem");
    } finally {
      setEditingMessage(false);
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

    let previousScrollHeight = 0;
    if (pageNumber > 1 && messagesContainerRef.current) {
      previousScrollHeight = messagesContainerRef.current.scrollHeight;
    }

    try {
      const response = await messageService.listMessagesFromRoom(roomId, pageNumber);
      
      if (pageNumber === 1) {
        const normalizedMessages = response.data.messages.map(normalizeMessage);
        setMessages(normalizedMessages);
        setInitialLoadDone(true);
        
        setTimeout(() => {
          scrollToBottom(true, true);
        }, 50);
      } else {
        const normalizedMessages = response.data.messages.map(normalizeMessage);
        setMessages(prev => [...normalizedMessages, ...prev]);
        
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            const newScrollHeight = container.scrollHeight;
            const scrollDifference = newScrollHeight - previousScrollHeight;
            container.scrollTop = scrollDifference;
          }
        }, 50);
      }

      setHasMore(response.data.currentPage < response.data.pages);
    } finally {
      setLoading(false);
      isLoadingOlderMessages.current = false;
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current || loading || !hasMore) return;

    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    if (scrollTop < lastScrollTop.current) {
      userScrolledUp.current = true;
    } else if (scrollHeight - scrollTop - clientHeight < 50) {
      userScrolledUp.current = false;
    }
    
    lastScrollTop.current = scrollTop;

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
      userScrolledUp.current = false;
      lastScrollTop.current = 0;
      listMessagesFromRoom(1);
    }
  }, [roomId]);

  return {
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
    deletingMessage,
    editingMessage,
    userRemovedFromRoom,
    onlineUsers,
    showOnlineUsers,
    loadingUsers,
    user,
    typingUsers,
    fileInputRef,
    messagesContainerRef,
    bottomRef,
    setInput,
    setEditingContent,
    setMessageToDelete,
    setDeleteDialogOpen,
    setShowOnlineUsers,
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
    handleTyping,
    stopTyping,
    handleImageLoad,
  };
}; 