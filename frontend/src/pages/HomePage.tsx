import React, { useEffect, useState } from "react";
import { useUser } from "../store/auth-store";
import type { APIRoom, UnreadCount } from "@/types/api";
import roomsService from "@/services/rooms-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ChatPage from "./chat/ChatPage";
import { io } from "socket.io-client";
import { Badge } from "@/components/ui/badge";

const Home: React.FC = () => {
  const [rooms, setRooms] = useState<APIRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>();
  const [selectedRoomName, setSelectedRoomName] = useState<string>();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const fetchUnreadCounts = async () => {
    try {
      const response = await roomsService.getUnreadCounts();
      const counts: Record<string, number> = {};
      response.data.forEach((item: UnreadCount) => {
        counts[item.roomId.toString()] = item.count;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  };

  const handleRooms = async () => {
    setLoading(true);

    try {
      const response = await roomsService.list();
      setRooms(response);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName) {
      toast.error("Nome da sala é obrigatório");
      return;
    }

    setIsCreatingRoom(true);

    try {
      const response = await roomsService.create({ name: roomName });
      // Não adiciona a sala aqui pois o socket irá notificar
      setOpen(false);
      setRoomName("");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  useEffect(() => {
    handleRooms();
    fetchUnreadCounts();

    if (!user?.token) return;

    console.log("Iniciando conexão do socket no HomePage");
    const socket = io("http://localhost:3001", {
      auth: {
        token: user.token
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("connect", () => {
      console.log("HomePage: Socket conectado com ID:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("HomePage: Erro na conexão do socket:", error);
    });

    socket.on("room_created", (newRoom: APIRoom) => {
      console.log("HomePage: Nova sala criada:", newRoom);
      const newRoomWithNew = { ...newRoom, newRoom: true };
      setRooms(prev => [newRoomWithNew, ...prev]);
    });

    socket.on("room_deleted", (deletedRoom: {id: string}) => {
      console.log("HomePage: Sala deletada:", deletedRoom);
      setRooms(prev => prev.filter(room => room.id !== deletedRoom.id));
      if (selectedRoomId === deletedRoom.id) {
        setSelectedRoomId(undefined);
        setSelectedRoomName(undefined);
      }
    });

    socket.on("unread_message", ({ roomId, lastMessage }) => {
      console.log("HomePage: Recebida notificação de mensagem não lida");
      console.log("Sala:", roomId);
      console.log("Sala selecionada:", selectedRoomId);
      console.log("Contador atual:", unreadCounts);
      
      setUnreadCounts(prev => {
        const newCount = (prev[roomId.toString()] || 0) + 1;
        console.log("Novo contador calculado:", newCount);
        const newCounts = {
          ...prev,
          [roomId.toString()]: newCount
        };
        console.log("Novos contadores:", newCounts);
        return newCounts;
      });

      // Atualiza a última mensagem da sala e move para o topo
      setRooms(prev => {
        const updatedRooms = prev.map(room => {
          if (room.id === roomId) {
            return {
              ...room,
              lastMessage: lastMessage
            };
          }
          return room;
        });
        
        // Move a sala atualizada para o topo
        const roomIndex = updatedRooms.findIndex(room => room.id === roomId);
        if (roomIndex > -1) {
          const [updatedRoom] = updatedRooms.splice(roomIndex, 1);
          updatedRooms.unshift(updatedRoom);
        }
        
        return updatedRooms;
      });
    });

    socket.on("receive_message", ({ roomId, lastMessage }) => {
      // Atualiza a última mensagem da sala e move para o topo para o usuário que enviou
      setRooms(prev => {
        const updatedRooms = prev.map(room => {
          if (room.id === roomId) {
            return {
              ...room,
              lastMessage: lastMessage
            };
          }
          return room;
        });
        
        // Move a sala atualizada para o topo
        const roomIndex = updatedRooms.findIndex(room => room.id === roomId);
        if (roomIndex > -1) {
          const [updatedRoom] = updatedRooms.splice(roomIndex, 1);
          updatedRooms.unshift(updatedRoom);
        }
        
        return updatedRooms;
      });
    });

    socket.on("messages_read", ({ roomId }) => {
      console.log("HomePage: Mensagens marcadas como lidas");
      console.log("Sala:", roomId);
      console.log("Contador atual:", unreadCounts);
      
      setUnreadCounts(prev => {
        const newCounts = {
          ...prev,
          [roomId.toString()]: 0
        };
        console.log("Novos contadores após leitura:", newCounts);
        return newCounts;
      });
    });

    return () => {
      console.log("HomePage: Desconectando socket");
      socket.disconnect();
    };
  }, [user?.token]);

  const handleRoomSelect = (room: APIRoom) => {
    console.log("HomePage: Selecionando sala:", room);
    setSelectedRoomId(room.id.toString());
    setSelectedRoomName(room.name);
    setRooms(prev => prev.map(r => ({ ...r, newRoom: r.id === room.id ? false : r.newRoom })));
    setUnreadCounts(prev => {
      const newCounts = {
        ...prev,
        [room.id.toString()]: 0
      };
      console.log("HomePage: Zerando contador para sala", room.id);
      console.log("Novos contadores:", newCounts);
      return newCounts;
    });
  };

  const formatUnreadCount = (count: number) => {
    return count > 99 ? '99+' : count;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Lista de salas (30%) */}
      <div className="w-[30%] p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Salas</h2>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-sm text-primary border-primary"
              >
                Nova sala
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[475px]">
              <DialogHeader>
                <DialogTitle>Nova sala</DialogTitle>
                <DialogDescription>
                  Crie uma nova sala para começar a conversar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Nome da sala"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  variant="default"
                  className="text-white"
                  onClick={handleCreateRoom}
                  disabled={isCreatingRoom}
                >
                  {isCreatingRoom ? (
                    <span>
                      <Loader2 className="animate-spin" />
                    </span>
                  ) : (
                    <span>Criar Sala</span>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Pesquisar sala..."
            className="w-full px-4 py-2 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
        </div>

        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
          {rooms.map((room, index) => (
            console.log(room),
            <div
              key={index}
              className={`flex items-center gap-4 p-3 bg-violet-50 hover:bg-violet-100 transition rounded-lg cursor-pointer shadow-sm ${selectedRoomId === room.id.toString() ? 'border-2 border-primary' : ''}`}
              onClick={() => handleRoomSelect(room)}
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-violet-400 text-white flex items-center justify-center rounded-full text-sm font-bold uppercase">
                  {room.name.charAt(0)}
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {room.name}
                  {room.newRoom && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md">
                      (Nova Sala)
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Clique para entrar na sala
                </p>
              </div>
              {unreadCounts[room.id.toString()] > 0 && (
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-500">
                    {new Date(room.lastMessage?.createdAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Badge variant="default" className="text-white">
                    {formatUnreadCount(unreadCounts[room.id.toString()])}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Área do chat (50%) */}
      <ChatPage roomId={selectedRoomId} roomName={selectedRoomName} />

      {/* Área lateral direita (20%) */}
      <div className="w-[20%] bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-xl font-semibold mb-4">Detalhes</h2>
        <div className="text-sm text-gray-600">
          Usuário: {user?.user?.username}
        </div>
      </div>
    </div>
  );
};

export default Home;
