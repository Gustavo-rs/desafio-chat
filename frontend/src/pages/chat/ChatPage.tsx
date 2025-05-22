import { useUser } from "@/store/auth-store";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  user: {
    id: number;
    username: string;
  };
  content: string;
}

interface ChatPageProps {
  roomId?: number;
  roomName?: string;
}

export default function ChatPage({ roomId, roomName }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (!roomId) return;

    const socket = io("http://localhost:3001", {
      auth: {
        token: user?.token
      }
    });

    socketRef.current = socket;

    socket.emit("join_room", roomId);

    socket.on("receive_message", (message: Message) => {
      if (message.user.id !== user?.user.id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const sendMessage = () => {
    if (!roomId) return;
    
    if (input.trim() && socketRef.current) {
      socketRef.current.emit("send_message", {
        content: input,
        roomId
      });

      // Adiciona apenas localmente a mensagem do usuário atual
      setMessages((prev) => [
        ...prev,
        {
          user: { id: user?.user.id!, username: user?.user.username! },
          content: input
        }
      ]);

      setInput("");
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

        <div className="flex-1 py-4 space-y-2 overflow-y-auto max-h-[400px]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-md max-w-[80%] ${
                msg.user.id === user?.user.id ? "bg-violet-100 ml-auto" : "bg-gray-100"
              }`}
            >
              <p className="text-sm text-gray-700">
                <span className="font-bold">{msg.user.username}:</span> {msg.content}
              </p>
            </div>
          ))}
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
          <button
            onClick={sendMessage}
            className="bg-violet-600 text-white px-4 py-2 rounded-md hover:bg-violet-700 transition"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
