import { useUser } from "@/store/auth-store";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import messageService from "@/services/message-service";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Message, ChatPageProps } from "@/types/api";

export default function ChatPage({ roomId, roomName }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const isLoadingOlderMessages = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
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

    const socket = io("http://localhost:3001", {
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

    return () => {
      console.log("ChatPage: Desconectando socket");
      socket.disconnect();
    };
  }, [roomId]);

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

        // Move a sala para o topo da lista
        const event = new CustomEvent("update_room_order", { detail: { roomId } });
        window.dispatchEvent(event);
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      }
    }
  };

useEffect(() => {
  if (initialLoadDone && messages.length > 0 && page === 1) {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }
}, [initialLoadDone, messages]);

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
                }`}
              >
                <div className={`p-2 rounded-md break-words ${
                  msg.user.id === user?.user.id ? "bg-violet-100" : "bg-gray-100"
                }`}>
                  <p className="text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span className="font-bold">{ msg.user.id === user?.user.id ? "Você" : msg.user.username}</span>
                      <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    {msg.content}
                    {msg.fileUrl && (
                      <div className="mt-2">
                        {msg.fileType?.startsWith('image/') ? (
                          <img 
                            src={`http://localhost:3001${msg.fileUrl}`} 
                            alt={msg.fileName} 
                            className="max-w-full rounded-lg"
                          />
                        ) : (
                          <a 
                            href={`http://localhost:3001${msg.fileUrl}`}
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
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {selectedFile && (
            <div className="flex items-center justify-between p-2 bg-violet-50 rounded-md">
              <span className="text-sm text-violet-700 truncate">{selectedFile.name}</span>
              <button
                onClick={removeSelectedFile}
                className="text-violet-600 hover:text-violet-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
              </svg>
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
