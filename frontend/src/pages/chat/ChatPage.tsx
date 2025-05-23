import { useUser } from "@/store/auth-store";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import messageService from "@/services/message-service";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Message {
  user: {
    id: string;
    username: string;
  };
  content: string;
  createdAt: string;
}

interface ChatPageProps {
  roomId?: string;
  roomName?: string;
}

export default function ChatPage({ roomId, roomName }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const isLoadingOlderMessages = useRef(false);

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

  const sendMessage = () => {
    if (!roomId) return;
    
    if (input.trim() && socketRef.current) {
      const message = {
        content: input,
        roomId
      };

      socketRef.current.emit("send_message", message);

      const newMessage = {
        user: { id: user?.user.id!, username: user?.user.username! },
        content: input,
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, newMessage]);
      setInput("");
      scrollToBottom();

      // Move a sala para o topo da lista
      const event = new CustomEvent("update_room_order", { detail: { roomId } });
      window.dispatchEvent(event);
    }
  };

  useLayoutEffect(() => {
    if (initialLoadDone && !isLoadingOlderMessages.current && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

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
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4 flex gap-2">
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
  );
}
