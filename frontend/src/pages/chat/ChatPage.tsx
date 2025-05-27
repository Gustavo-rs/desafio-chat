import { useUser } from "@/store/auth-store";
import { useEffect, useRef, useState, useCallback } from "react";
import messageService from "@/services/message-service";
import { useSocketMessages } from "@/hooks/useSocketMessages";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Edit2, Trash2, Check, X, Paperclip, AlertTriangle, Users, UserCheck, UserMinus, UserPlus, File, MessageSquare } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import type { Message, ChatPageProps, MessageStatus, OnlineUser } from "@/types/api";

export default function ChatPage({ roomId, roomName }: ChatPageProps) {
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
    handleMessageUpdated: (messageId: string, content: string, updatedMessage?: Message) => {
      if (updatedMessage) {
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        ));
      }
    },
    handleUserJoined: (userId: string, username: string, roomId: string) => {
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
    handleUserLeft: (userId: string, username: string, roomId: string) => {
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
    handleMemberAdded: (roomId: string, member: any) => {
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
    handleMemberRemoved: (roomId: string, removedUserId: string) => {
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
    handleRoomUsersUpdated: (roomId: string, users: any[], count: number) => {
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

  // Hook para gerenciar socket
  const { sendMessage: socketSendMessage, isConnected } = useSocketMessages({
    roomId,
    currentUserId: user?.user?.id,
    onMessageReceived: handleMessageReceived,
    onMessageDeleted: handleMessageDeleted,
    onMessageUpdated: handleMessageUpdated,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onMemberAdded: handleMemberAdded,
    onMemberRemoved: handleMemberRemoved,
    onRoomUsersUpdated: handleRoomUsersUpdated
  });

  // Inicializar dados da sala
  useEffect(() => {
    if (!roomId) return;

    setPage(1);
    setMessages([]);
    setHasMore(true);
    setUserRemovedFromRoom(false);
    setLoadingUsers(true);
    
    listMessagesFromRoom();
  }, [roomId]);

  useEffect(() => {
    if (initialLoadDone && !isLoadingOlderMessages.current && messages.length > 0) {
      const timeout = setTimeout(scrollToBottom, 0);
      return () => clearTimeout(timeout);
    }
  }, [messages, initialLoadDone]);
  

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
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
    if (!roomId) return;
    
    if ((input.trim() || selectedFiles.length > 0) && isConnected) {
      try {
        const response = await messageService.createMessageWithMultipleFiles(
          input, 
          roomId, 
          selectedFiles
        );
        const message = response.data;

        socketSendMessage(message);

        setInput("");
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      }
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
      // A atualização local será feita pelo evento socket
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
      // Atualiza localmente primeiro para feedback imediato
      setMessages((prev) => prev.map(msg => 
        msg.id === messageId ? { 
          ...msg, 
          content: editingContent, 
          status: 'EDITED' as MessageStatus, 
          updatedAt: new Date().toISOString() 
        } : msg
      ));
      
      await messageService.updateMessage(messageId, editingContent);
      setEditingMessageId(null);
      setEditingContent("");
      // A atualização final será feita pelo evento socket
    } catch (error) {
      console.error("Erro ao editar mensagem:", error);
      // Em caso de erro, reverte a alteração local
      setMessages((prev) => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'ACTIVE' as MessageStatus } : msg
      ));
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
    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    const previousScrollTop = container?.scrollTop ?? 0;
  
    try {
      const response = await messageService.listMessagesFromRoom(roomId, pageNumber);
      console.log('Resposta da API:', response.data.messages);
      
      const newMessages = response.data.messages.map(normalizeMessage);
      console.log('Mensagens normalizadas:', newMessages);
  
      if (pageNumber === 1) {
        setMessages(newMessages);
        setInitialLoadDone(true);
      } else {
        isLoadingOlderMessages.current = true;
        setMessages((prev) => [...newMessages, ...prev]);
  
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const newScrollHeight = container?.scrollHeight ?? 0;
            const scrollDiff = newScrollHeight - previousScrollHeight;
  
            if (container) {
              container.scrollTop = previousScrollTop + scrollDiff;
            }
  
            isLoadingOlderMessages.current = false;
          });
        });
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

  if (!roomId) {
    return (
      <div className="w-full h-full bg-white rounded-lg shadow-sm p-3 md:p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Nenhuma sala selecionada</p>
          <p className="text-sm">Selecione uma sala para começar a conversar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-sm p-3 md:p-4">
      <div className="h-full flex flex-col">
        <div className="border-b pb-3 md:pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">Chat</h2>
              {roomName && (
                <>
                  <span className="text-gray-400">•</span>
                  <h3 className="text-base md:text-lg font-medium text-gray-600 truncate">{roomName}</h3>
                </>
              )}
            </div>
          </div>
          
          {!userRemovedFromRoom && (
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {loadingUsers ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-violet-500" />
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    <span className="hidden sm:inline">{onlineUsers.length} usuário{onlineUsers.length !== 1 ? 's' : ''} online</span>
                    <span className="sm:hidden">{onlineUsers.length} online</span>
                    <span className="text-xs hidden md:inline">({showOnlineUsers ? 'ocultar' : 'mostrar'})</span>
                  </>
                )}
                
              </button>
            </div>
          )}

          {showOnlineUsers && !userRemovedFromRoom && (
            <div className="mt-2 md:mt-3 p-2 md:p-3 bg-gray-50 rounded-lg">
              <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                {loadingUsers ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-violet-500" />
                    <span>Carregando...</span>
                  </>
                ) : (
                  <>
                    <Users size={14} />
                    <span className="hidden sm:inline">Usuários Online ({onlineUsers.length})</span>
                    <span className="sm:hidden">Online ({onlineUsers.length})</span>
                  </>
                )}
              </h4>
              
              {loadingUsers ? (
                <div className="flex items-center justify-center py-2 md:py-4">
                  <Loader2 size={20} className="animate-spin text-violet-500" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 md:gap-2">
                  {onlineUsers.map((onlineUser) => (
                    <div
                      key={onlineUser.userId}
                      className="flex items-center gap-2 text-xs md:text-sm transition-all duration-200 ease-in-out"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className={`truncate ${onlineUser.userId === user?.user.id ? "font-semibold text-violet-700" : "text-gray-700"}`}>
                        {onlineUser.userId === user?.user.id ? "Você" : onlineUser.username}
                      </span>
                    </div>
                  ))}
                  {onlineUsers.length === 0 && (
                    <p className="text-xs md:text-sm text-gray-500 italic col-span-full">Nenhum usuário online</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div 
          ref={messagesContainerRef} 
          className="flex-1 py-2 md:py-4 space-y-1 md:space-y-2 overflow-y-auto min-h-0"
          onScroll={handleScroll}
        >
          {loading && page > 1 && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          )}
          
          {userRemovedFromRoom ? (
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center text-red-500 bg-red-50 border border-red-200 rounded-lg p-4 md:p-6 max-w-sm md:max-w-md">
                <AlertTriangle size={40} className="mx-auto mb-3 md:mb-4 text-red-400" />
                <h3 className="text-base md:text-lg font-semibold mb-2">Acesso Removido</h3>
                <p className="text-xs md:text-sm text-red-600">
                  Você foi removido desta sala e não pode mais visualizar ou enviar mensagens.
                </p>
                <p className="text-xs text-red-500 mt-2">
                  Selecione outra sala para continuar conversando.
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 text-sm md:text-base">Nenhuma mensagem encontrada nesta sala</p>
            </div>
          ) : (
            messages.map((msg, idx) => 
              // Renderização especial para mensagens do sistema
              msg.isSystemMessage ? (
                <div key={idx} className="flex justify-center my-1 md:my-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-md px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-blue-700 flex items-center gap-1 md:gap-2">
                    {msg.systemMessageType === 'user_joined' ? (
                      <UserCheck size={14} className="text-green-600" />
                    ) : msg.systemMessageType === 'user_left' ? (
                      <UserMinus size={14} className="text-orange-600" />
                    ) : msg.systemMessageType === 'member_added' ? (
                      <UserPlus size={14} className="text-blue-600" />
                    ) : msg.systemMessageType === 'member_removed' ? (
                      <UserMinus size={14} className="text-red-600" />
                    ) : (
                      <UserMinus size={14} className="text-orange-600" />
                    )}
                    <span className="font-medium">{msg.content}</span>
                    <span className="text-xs text-blue-500">
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ) : (
                // Renderização normal para mensagens de usuário
                <div
                  key={idx}
                  className={`p-1 md:p-2 rounded-md max-w-[90%] md:max-w-[80%] ${
                    msg.user.id === user?.user.id ? "ml-auto" : ""
                  } group transition-all duration-200 ease-in-out ${
                    editingMessageId === msg.id ? "ring-2 ring-violet-300 ring-opacity-50" : ""
                  } ${msg.status === 'DELETED' ? "opacity-60" : ""}`}
                >
                  <div className={`p-2 md:p-3 rounded-lg break-words transition-all duration-200 ${
                    msg.status === 'DELETED'
                      ? "bg-red-50 border border-red-100 border-dashed" 
                      : msg.user.id === user?.user.id 
                        ? "bg-violet-100 hover:bg-violet-50" 
                        : "bg-gray-100 hover:bg-gray-50"
                  } ${editingMessageId === msg.id ? "bg-violet-50 border-2 border-violet-200" : ""}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1 md:mb-2">
                          <span className="font-semibold text-xs md:text-sm truncate">
                            {msg.user.id === user?.user.id ? "Você" : msg.user.username}
                          </span>
                          <div className="flex items-center gap-2">
                           
                            
                            {/* Botões de ação para mensagens próprias - apenas se não for deletada */}
                            {msg.user.id === user?.user.id && editingMessageId !== msg.id && msg.status !== 'DELETED' && (
                              <div className="flex gap-1 md:gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 ease-in-out">
                                <button
                                  onClick={() => startEditing(msg.id, msg.content)}
                                  className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                                  title="Editar mensagem"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                                  title="Deletar mensagem"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                             {/* Indicador de mensagem editada */}
                             {msg.status === 'EDITED' && (
                              <span className="text-xs text-gray-400 italic flex items-center gap-1" title={`Editada às ${msg.updated_at ? new Date(msg.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}`}>
                                <Edit2 size={10} />
                                editada
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                        
                        {editingMessageId === msg.id ? (
                          <div className="mt-2 md:mt-3 space-y-2 md:space-y-3">
                            <div className="flex items-center gap-2 text-xs text-violet-600 font-medium">
                              <Edit2 size={12} />
                              <span className="hidden sm:inline">Editando mensagem...</span>
                              <span className="sm:hidden">Editando...</span>
                            </div>
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full p-2 md:p-3 border-2 border-violet-200 rounded-lg resize-none text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                              rows={2}
                              autoFocus
                              placeholder="Digite sua mensagem..."
                            />
                            <div className="flex gap-1 md:gap-2 justify-end">
                              <button
                                onClick={() => handleEditMessage(msg.id)}
                                className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 text-xs md:text-sm font-medium shadow-sm hover:shadow-md"
                                title="Salvar alterações"
                              >
                                <Check size={16} />
                                <span className="hidden sm:inline">Salvar</span>
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 text-xs md:text-sm font-medium shadow-sm hover:shadow-md"
                                title="Cancelar edição"
                              >
                                <X size={16} />
                                <span className="hidden sm:inline">Cancelar</span>
                              </button>
                            </div>
                          </div>
                        ) : msg.status === 'DELETED' ? (
                          <div className="flex items-center gap-2 text-gray-500 italic py-2">
                            <Trash2 size={16} className="text-red-400" />
                            <span className="text-sm">Esta mensagem foi excluída</span>
                          </div>
                        ) : (
                          <ReactMarkdown 
                            components={{
                              // Links abrem em nova aba
                              a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 underline decoration-2 underline-offset-2 transition-colors duration-200" />,
                              // Código inline com estilo
                              code: (props) => <code {...props} className="bg-violet-50 border border-violet-200 px-2 py-1 rounded-md text-sm font-mono text-violet-800" />,
                              // Citações com estilo
                              blockquote: (props) => <blockquote {...props} className="border-l-4 border-violet-300 pl-4 my-2 italic text-gray-700 bg-violet-25 py-2 rounded-r-md" />,
                              // Quebras de linha
                              p: (props) => <p {...props} className="mb-1 last:mb-0 leading-relaxed" />,
                              // Listas
                              ul: (props) => <ul {...props} className="list-disc list-inside ml-2 space-y-1" />,
                              ol: (props) => <ol {...props} className="list-decimal list-inside ml-2 space-y-1" />,
                              // Headers
                              h1: (props) => <h1 {...props} className="text-lg font-bold text-gray-800 mb-2" />,
                              h2: (props) => <h2 {...props} className="text-base font-semibold text-gray-800 mb-1" />,
                              h3: (props) => <h3 {...props} className="text-sm font-semibold text-gray-800 mb-1" />
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                    
                    {/* Arquivos anexos - só mostrar se a mensagem não foi deletada */}
                    {msg.status !== 'DELETED' && (
                      <div className="mt-2">
                        {/* Múltiplos arquivos (novo formato) */}
                        {msg.files && msg.files.length > 0 && (
                          <div className="space-y-2">
                            {msg.files.map((file, index) => {
                              console.log('Arquivo:', file, 'URL completa:', `${import.meta.env.VITE_API_URL}${file.file_url}`);
                              return (
                                <div key={file.id || index}>
                                  {file.file_type?.startsWith('image/') ? (
                                    <img 
                                      src={`${import.meta.env.VITE_API_URL}${file.file_url}`} 
                                      alt={file.file_name} 
                                      className="max-w-full rounded-lg"
                                      onError={(e) => console.error('Erro ao carregar imagem:', e.currentTarget.src)}
                                      onLoad={() => console.log('Imagem carregada com sucesso:', file.file_name)}
                                    />
                                  ) : (
                                    <a 
                                      href={`${import.meta.env.VITE_API_URL}${file.file_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-violet-600 hover:text-violet-700 p-2 bg-gray-50 rounded-md"
                                    >
                                      <File size={16} />
                                      <span className="truncate">{file.file_name}</span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      
                      </div>
                    )}
                  </div>
                </div>
              )
            )
          )}
          <div ref={bottomRef} />
        </div>

        {!userRemovedFromRoom && (
          <div className="mt-2 md:mt-4 flex flex-col gap-2">
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-violet-700 font-medium">
                    {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''} selecionado{selectedFiles.length > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={clearAllFiles}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Limpar todos
                  </button>
                </div>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-violet-50 rounded-md">
                    <span className="text-xs md:text-sm text-violet-700 truncate">{file.name}</span>
                    <button
                      onClick={() => removeSelectedFile(index)}
                      className="text-violet-600 hover:text-violet-700"
                    >
                      <X className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-1 md:gap-2">
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                className="flex-1 p-2 md:p-3 border rounded-md text-sm md:text-base"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="border-violet-200 hover:bg-violet-50 px-2 md:px-3"
              >
                <Paperclip className="h-4 w-4 md:h-5 md:w-5 text-violet-600" />
              </Button>
              <Button
                onClick={sendMessage}
                variant="default"
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 px-3 md:px-4"
              >
                <span className="text-white text-sm md:text-base">Enviar</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Tem certeza que deseja deletar esta mensagem? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={cancelDeleteMessage}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteMessage}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 size={16} className="mr-2" />
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
