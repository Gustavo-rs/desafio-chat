import { useUser } from "@/store/auth-store";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import messageService from "@/services/message-service";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Edit2, Trash2, Check, X, Paperclip, AlertTriangle, Users, UserCheck, UserMinus, UserPlus, File } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import type { Message, ChatPageProps, MessageStatus, OnlineUser } from "@/types/api";

// Componente Skeleton simples
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
);

// Componente de skeleton para simular mensagens
const MessageSkeleton = ({ isOwnMessage = false }: { isOwnMessage?: boolean }) => (
  <div className={`p-2 rounded-md max-w-[80%] ${isOwnMessage ? "ml-auto" : ""}`}>
    <div className={`p-2 rounded-md ${isOwnMessage ? "bg-violet-100" : "bg-gray-100"}`}>
      <div className="flex justify-between mb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className={`h-4 ${Math.random() > 0.5 ? 'w-3/4' : 'w-full'}`} />
      {Math.random() > 0.7 && <Skeleton className="h-4 w-1/2 mt-1" />}
    </div>
  </div>
);

// Função para gerar skeletons de mensagens
const generateMessageSkeletons = () => {
  const skeletons = [];
  for (let i = 0; i < 20; i++) {
    skeletons.push(
      <MessageSkeleton 
        key={`skeleton-${i}`} 
        isOwnMessage={Math.random() > 0.5} 
      />
    );
  }
  return skeletons;
};

export default function ChatPage({ roomId, roomName }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  
  // Estados melhorados para usuários online
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const isLoadingOlderMessages = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // Função para normalizar mensagens vindas da API ou Socket
  const normalizeMessage = (msg: any): Message => {
    return {
      id: msg.id,
      user: {
        id: msg.user.id,
        username: msg.user.username,
      },
      content: msg.content || "",
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt || msg.createdAt,
      status: msg.status || 'ACTIVE',
      fileName: msg.fileName,
      fileUrl: msg.fileUrl,
      fileType: msg.fileType,
      fileSize: msg.fileSize,
      isSystemMessage: msg.isSystemMessage,
      systemMessageType: msg.systemMessageType,
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

  useEffect(() => {
    if (!roomId) return;

    setPage(1);
    setMessages([]);
    setHasMore(true);
    
    // Não resetar onlineUsers imediatamente, apenas marcar como loading
    setLoadingUsers(true);
    
    listMessagesFromRoom();

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3001", {
      withCredentials: true
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("ChatPage: Socket conectado");
      socket.emit("join_room", roomId);
      // Notificar que começou a visualizar a sala
      socket.emit("start_viewing_room", roomId);
    });

    // Listener para detectar mudanças de visibilidade da aba
    const handleVisibilityChange = () => {
      if (socket.connected) {
        if (document.hidden) {
          console.log("ChatPage: Aba ficou inativa, parando visualização");
          socket.emit("stop_viewing_room", roomId);
        } else {
          console.log("ChatPage: Aba ficou ativa, iniciando visualização");
          socket.emit("start_viewing_room", roomId);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    socket.on("receive_message", (data: any) => {
      console.log("ChatPage: Nova mensagem recebida:", data);
      
      const { roomId: eventRoomId, message } = data;
      
      // Só processar se for da sala atual e não for do próprio usuário
      if (eventRoomId === roomId && message.user.id !== user?.user.id) {
        const normalizedMessage = normalizeMessage(message);
        setMessages((prev) => [...prev, normalizedMessage]);
        scrollToBottom();
      }
    });

    socket.on("message_deleted", ({ messageId, message: updatedMessage }) => {
      console.log("ChatPage: Mensagem deletada:", messageId, updatedMessage);
      if (updatedMessage) {
        const normalizedMessage = normalizeMessage(updatedMessage);
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId ? normalizedMessage : msg
        ));
      }
    });

    socket.on("message_updated", ({ messageId, content, message: updatedMessage }) => {
      console.log("ChatPage: Mensagem editada:", messageId, content, updatedMessage);
      if (updatedMessage) {
        const normalizedMessage = normalizeMessage(updatedMessage);
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId ? normalizedMessage : msg
        ));
      }
    });

    // Eventos de usuários online melhorados
    socket.on("room_users_updated", ({ roomId: updatedRoomId, users, count }) => {
      if (updatedRoomId === roomId) {
        console.log("ChatPage: Lista de usuários atualizada:", users);
        setOnlineUsers(users);
        setLoadingUsers(false); // Parar loading quando receber dados
      }
    });

    socket.on("user_joined_room", ({ userId, username, roomId: joinedRoomId }) => {
      if (joinedRoomId === roomId && userId !== user?.user.id) {
        console.log("ChatPage: Usuário entrou na sala:", username);
        
        // Criar mensagem do sistema
        const systemMessage: Message = {
          id: `system-join-${Date.now()}-${userId}`,
          user: {
            id: 'system',
            username: 'Sistema'
          },
          content: `${username} entrou na sala`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'ACTIVE',
          isSystemMessage: true,
          systemMessageType: 'user_joined'
        };
        
        setMessages((prev) => [...prev, systemMessage]);
        scrollToBottom();
      }
    });

    socket.on("user_left_room", ({ userId, username, roomId: leftRoomId }) => {
      if (leftRoomId === roomId && userId !== user?.user.id) {
        console.log("ChatPage: Usuário saiu da sala:", username);
        
        // Criar mensagem do sistema
        const systemMessage: Message = {
          id: `system-leave-${Date.now()}-${userId}`,
          user: {
            id: 'system',
            username: 'Sistema'
          },
          content: `${username} saiu da sala`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'ACTIVE',
          isSystemMessage: true,
          systemMessageType: 'user_left'
        };
        
        setMessages((prev) => [...prev, systemMessage]);
        scrollToBottom();
      }
    });

    // Eventos de membros de sala
    socket.on("member_added", ({ roomId: eventRoomId, member }) => {
      if (eventRoomId === roomId) {
        console.log("ChatPage: Membro adicionado à sala:", member);
        
        // Criar mensagem do sistema
        const systemMessage: Message = {
          id: `system-member-added-${Date.now()}-${member.user.id}`,
          user: {
            id: 'system',
            username: 'Sistema'
          },
          content: `${member.user.username} foi adicionado à sala`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'ACTIVE',
          isSystemMessage: true,
          systemMessageType: 'member_added'
        };
        
        setMessages((prev) => [...prev, systemMessage]);
        scrollToBottom();
      }
    });

    socket.on("member_removed", ({ roomId: eventRoomId, removedUserId }) => {
      if (eventRoomId === roomId) {
        console.log("ChatPage: Membro removido da sala:", removedUserId);
        
        // Buscar o nome do usuário removido nas mensagens existentes
        const removedUserMessage = messages.find(msg => msg.user.id === removedUserId);
        const removedUsername = removedUserMessage?.user.username || 'Usuário';
        
        // Criar mensagem do sistema
        const systemMessage: Message = {
          id: `system-member-removed-${Date.now()}-${removedUserId}`,
          user: {
            id: 'system',
            username: 'Sistema'
          },
          content: `${removedUsername} foi removido da sala`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'ACTIVE',
          isSystemMessage: true,
          systemMessageType: 'member_removed'
        };
        
        setMessages((prev) => [...prev, systemMessage]);
        scrollToBottom();
      }
    });

    return () => {
      console.log("ChatPage: Desconectando socket e saindo da sala");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (socket.connected) {
        socket.emit("leave_room", roomId);
        // Notificar que parou de visualizar a sala
        socket.emit("stop_viewing_room", roomId);
      }
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (initialLoadDone && !isLoadingOlderMessages.current && messages.length > 0) {
      const timeout = setTimeout(scrollToBottom, 0);
      return () => clearTimeout(timeout);
    }
  }, [messages, initialLoadDone]);
  

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!roomId) return;
    
    if ((input.trim() || selectedFile) && socketRef.current) {
      const formData = new FormData();
      formData.append('content', input);
      formData.append('roomId', roomId);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      try {
        const response = await messageService.createMessage(formData);
        const message = response.data;

        socketRef.current.emit("send_message", message);

        const normalizedMessage = normalizeMessage(message);
        setMessages((prev) => [...prev, normalizedMessage]);
        setInput("");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        scrollToBottom();
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
      <div className="w-[50%] bg-white rounded-lg shadow-sm p-4 flex items-center justify-center">
        <p className="text-gray-500">Selecione uma sala para começar a conversar</p>
      </div>
    );
  }

  return (
    <div className="w-[50%] bg-white rounded-lg shadow-sm p-4">
      <div className="h-full flex flex-col">
        <div className="border-b pb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Chat</h2>
            <h2 className="text-xl font-semibold">{roomName}</h2>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setShowOnlineUsers(!showOnlineUsers)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {loadingUsers ? (
                <>
                  <Loader2 size={16} className="animate-spin text-violet-500" />
                </>
              ) : (
                <>
                  <Users size={16} />
                  <span>{onlineUsers.length} usuário{onlineUsers.length !== 1 ? 's' : ''} online</span>
                  <span className="text-xs">({showOnlineUsers ? 'ocultar' : 'mostrar'})</span>
                </>
              )}
              
            </button>
          </div>

          {showOnlineUsers && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                {loadingUsers ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-violet-500" />
                    <span>Carregando usuários...</span>
                  </>
                ) : (
                  <>
                    <Users size={14} />
                    <span>Usuários Online ({onlineUsers.length})</span>
                  </>
                )}
              </h4>
              
              {loadingUsers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={20} className="animate-spin text-violet-500" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {onlineUsers.map((onlineUser) => (
                    <div
                      key={onlineUser.userId}
                      className="flex items-center gap-2 text-sm transition-all duration-200 ease-in-out"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className={onlineUser.userId === user?.user.id ? "font-semibold text-violet-700" : "text-gray-700"}>
                        {onlineUser.userId === user?.user.id ? "Você" : onlineUser.username}
                      </span>
                    </div>
                  ))}
                  {onlineUsers.length === 0 && (
                    <p className="text-sm text-gray-500 italic col-span-2">Nenhum usuário online</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div 
          ref={messagesContainerRef} 
          className="flex-1 py-4 space-y-2 overflow-y-auto"
          onScroll={handleScroll}
        >
          {loading && page > 1 && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          )}
          
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Nenhuma mensagem encontrada nesta sala</p>
            </div>
          ) : (
            messages.map((msg, idx) => 
              // Renderização especial para mensagens do sistema
              msg.isSystemMessage ? (
                <div key={idx} className="flex justify-center my-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
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
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ) : (
                // Renderização normal para mensagens de usuário
                <div
                  key={idx}
                  className={`p-2 rounded-md max-w-[80%] ${
                    msg.user.id === user?.user.id ? "ml-auto" : ""
                  } group transition-all duration-200 ease-in-out ${
                    editingMessageId === msg.id ? "ring-2 ring-violet-300 ring-opacity-50" : ""
                  } ${msg.status === 'DELETED' ? "opacity-60" : ""}`}
                >
                  <div className={`p-3 rounded-lg break-words transition-all duration-200 ${
                    msg.status === 'DELETED'
                      ? "bg-red-50 border border-red-100 border-dashed" 
                      : msg.user.id === user?.user.id 
                        ? "bg-violet-100 hover:bg-violet-50" 
                        : "bg-gray-100 hover:bg-gray-50"
                  } ${editingMessageId === msg.id ? "bg-violet-50 border-2 border-violet-200" : ""}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-sm">
                            {msg.user.id === user?.user.id ? "Você" : msg.user.username}
                          </span>
                          <div className="flex items-center gap-2">
                           
                            
                            {/* Botões de ação para mensagens próprias - apenas se não for deletada */}
                            {msg.user.id === user?.user.id && editingMessageId !== msg.id && msg.status !== 'DELETED' && (
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                                <button
                                  onClick={() => startEditing(msg.id, msg.content)}
                                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                                  title="Editar mensagem"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                                  title="Deletar mensagem"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                             {/* Indicador de mensagem editada */}
                             {msg.status === 'EDITED' && (
                              <span className="text-xs text-gray-400 italic flex items-center gap-1" title={`Editada às ${msg.updatedAt ? new Date(msg.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}`}>
                                <Edit2 size={10} />
                                editada
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                        
                        {editingMessageId === msg.id ? (
                          <div className="mt-3 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-violet-600 font-medium">
                              <Edit2 size={12} />
                              Editando mensagem...
                            </div>
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full p-3 border-2 border-violet-200 rounded-lg resize-none text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                              rows={3}
                              autoFocus
                              placeholder="Digite sua mensagem..."
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleEditMessage(msg.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 text-sm font-medium shadow-sm hover:shadow-md"
                                title="Salvar alterações"
                              >
                                <Check size={16} />
                                Salvar
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 text-sm font-medium shadow-sm hover:shadow-md"
                                title="Cancelar edição"
                              >
                                <X size={16} />
                                Cancelar
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
                    {msg.fileUrl && msg.status !== 'DELETED' && (
                      <div className="mt-2">
                        {msg.fileType?.startsWith('image/') ? (
                          <img 
                          src={`${import.meta.env.VITE_API_URL}${msg.fileUrl}`} 
                            alt={msg.fileName} 
                            className="max-w-full rounded-lg"
                          />
                        ) : (
                          <a 
                          href={`${import.meta.env.VITE_API_URL}${msg.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-violet-600 hover:text-violet-700"
                          >
                            <File size={16} />
                            {msg.fileName}
                          </a>
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

        <div className="mt-4 flex flex-col gap-2">
          {selectedFile && (
            <div className="flex items-center justify-between p-2 bg-violet-50 rounded-md">
              <span className="text-sm text-violet-700 truncate">{selectedFile.name}</span>
              <button
                onClick={removeSelectedFile}
                className="text-violet-600 hover:text-violet-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              className="flex-1 p-2 border rounded-md"
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
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-violet-200 hover:bg-violet-50"
            >
              <Paperclip className="h-5 w-5 text-violet-600" />
            </Button>
            <Button
              onClick={sendMessage}
              variant="default"
              className="bg-violet-600 hover:bg-violet-700"
            >
              <span className="text-white">Enviar</span>
            </Button>
          </div>
        </div>
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
