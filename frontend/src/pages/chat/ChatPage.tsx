import { useUser } from "@/store/auth-store";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import messageService from "@/services/message-service";
import { Button } from "@/components/ui/button";
import { Loader2, Edit2, Trash2, Check, X, Paperclip } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import type { Message, ChatPageProps } from "@/types/api";

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const isLoadingOlderMessages = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

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
    listMessagesFromRoom();

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3001", {
      withCredentials: true
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("ChatPage: Socket conectado");
      socket.emit("join_room", roomId);
    });

    socket.on("receive_message", (message: Message) => {
      console.log("ChatPage: Nova mensagem recebida:", message);
      if (message.user.id !== user?.user.id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    });

    socket.on("message_deleted", ({ messageId }) => {
      console.log("ChatPage: Mensagem deletada:", messageId);
      setMessages((prev) => prev.filter(msg => msg.id !== messageId));
    });

    socket.on("message_updated", ({ messageId, content }) => {
      console.log("ChatPage: Mensagem editada:", messageId, content);
      setMessages((prev) => prev.map(msg => 
        msg.id === messageId ? { ...msg, content } : msg
      ));
    });

    return () => {
      console.log("ChatPage: Desconectando socket");
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

        setMessages((prev) => [...prev, message]);
        setInput("");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        scrollToBottom();

        const event = new CustomEvent("update_room_order", { detail: { roomId } });
        window.dispatchEvent(event);
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta mensagem?")) return;
    
    try {
      await messageService.deleteMessage(messageId);
      // A atualização local será feita pelo evento socket
    } catch (error) {
      console.error("Erro ao deletar mensagem:", error);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return;
    
    try {
      await messageService.updateMessage(messageId, editingContent);
      setEditingMessageId(null);
      setEditingContent("");
      // A atualização local será feita pelo evento socket
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
    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    const previousScrollTop = container?.scrollTop ?? 0;
  
    try {
      const response = await messageService.listMessagesFromRoom(roomId, pageNumber);
      const newMessages = response.data.messages;
  
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
        <div className="border-b pb-4 flex justify-between">
          <h2 className="text-xl font-semibold">Chat</h2>
          <h2 className="text-xl font-semibold">{roomName}</h2>
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
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-md max-w-[80%] ${
                  msg.user.id === user?.user.id ? "ml-auto" : ""
                } group`}
              >
                <div className={`p-2 rounded-md break-words ${
                  msg.user.id === user?.user.id ? "bg-violet-100" : "bg-gray-100"
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-bold">{ msg.user.id === user?.user.id ? "Você" : msg.user.username}</span>
                        <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      
                      {editingMessageId === msg.id ? (
                        <div className="mt-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full p-2 border rounded-md resize-none text-sm"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleEditMessage(msg.id)}
                              className="text-green-600 hover:text-green-700"
                              title="Salvar"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-600 hover:text-gray-700"
                              title="Cancelar"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <ReactMarkdown 
                          components={{
                            // Links abrem em nova aba
                            a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 underline" />,
                            // Código inline com estilo
                            code: (props) => <code {...props} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" />,
                            // Citações com estilo
                            blockquote: (props) => <blockquote {...props} className="border-l-4 border-violet-200 pl-3 italic text-gray-600" />,
                            // Quebras de linha
                            p: (props) => <p {...props} className="mb-1 last:mb-0" />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                    
                    {/* Botões de ação para mensagens próprias */}
                    {msg.user.id === user?.user.id && editingMessageId !== msg.id && (
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(msg.id, msg.content)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Deletar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {msg.fileUrl && (
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
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                          </svg>
                          {msg.fileName}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
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
    </div>
  );
}
