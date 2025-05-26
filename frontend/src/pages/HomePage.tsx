import React, { useEffect, useState, useRef } from "react";
import { useUser } from "../store/auth-store";
import type { APIRoom } from "@/types/api";
import roomsService from "@/services/rooms-service";
import { toast } from "sonner";
import ChatPage from "./chat/ChatPage";
import { io } from "socket.io-client";
import RoomPage from "./rooms/RoomPage";
import RoomDetailsPage from "./room-details/RoomDetailsPage";

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



  // Referência para o socket para poder enviar eventos de visualização
  const socketRef = useRef<any>(null);

  const handleRooms = async () => {
    setLoading(true);

    try {
      const response = await roomsService.list();
      setRooms(response);
      // Initialize unread counts from rooms data
      const counts: Record<string, number> = {};
      response.forEach((room: APIRoom) => {
        counts[room.id.toString()] = room.unreadCount || 0;
      });
      setUnreadCounts(counts);
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
      await roomsService.create({ name: roomName });

      setOpen(false);
      setRoomName("");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  useEffect(() => {
    handleRooms();

    if (!user) return;

    console.log("Iniciando conexão do socket no HomePage");
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Armazenar referência do socket
    socketRef.current = socket;

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

    socket.on("receive_message", ({ roomId, message }) => {
      // Atualiza a última mensagem da sala e move para o topo para o usuário que enviou
      console.log("HomePage: Recebida mensagem:", message);
      setRooms(prev => {
        const updatedRooms = prev.map(room => {
          if (room.id === roomId) {
            return {
              ...room,
              lastMessage: message
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

    // Eventos de membros de sala
    socket.on("member_added", ({ roomId, member }) => {
      console.log("HomePage: Membro adicionado à sala:", roomId, member);
      
      // Se o usuário atual foi adicionado, buscar a sala e adicioná-la à lista
      if (member.user.id === user?.user?.id) {
        console.log("HomePage: Usuário atual foi adicionado à sala, recarregando lista");
        handleRooms(); // Recarregar lista de salas
        toast.success(`Você foi adicionado à sala "${member.room.name}"`);
      }
    });

    socket.on("member_removed", ({ roomId, removedUserId }) => {
      console.log("HomePage: Membro removido da sala:", roomId, removedUserId);
      
      // Se o usuário atual foi removido, remover a sala da lista
      if (removedUserId === user?.user?.id) {
        console.log("HomePage: Usuário atual foi removido da sala, removendo da lista");
        setRooms(prev => prev.filter(room => room.id !== roomId));
        
        // Se estava visualizando a sala removida, limpar seleção
        if (selectedRoomId === roomId) {
          setSelectedRoomId(undefined);
          setSelectedRoomName(undefined);
        }
        
        // Remover contador de não lidas
        setUnreadCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[roomId.toString()];
          return newCounts;
        });
        
        toast.error("Você foi removido da sala");
      }
    });

    return () => {
      console.log("HomePage: Desconectando socket");
      
      // Parar de visualizar a sala atual se houver uma selecionada
      if (selectedRoomId && socketRef.current?.connected) {
        socketRef.current.emit("stop_viewing_room", selectedRoomId);
      }
      
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const handleRoomSelect = (room: APIRoom) => {
    console.log("HomePage: Selecionando sala:", room);
    
    // Se havia uma sala selecionada anteriormente, parar de visualizá-la
    if (selectedRoomId && socketRef.current?.connected) {
      socketRef.current.emit("stop_viewing_room", selectedRoomId);
    }
    
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
    return count > 99 ? '99+' : count.toString();
  };



  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Lista de salas (30%) */}
      <RoomPage 
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        unreadCounts={unreadCounts}
        open={open}
        setOpen={setOpen}
        roomName={roomName}
        setRoomName={setRoomName}
        isCreatingRoom={isCreatingRoom}
        handleCreateRoom={handleCreateRoom}
        handleRoomSelect={handleRoomSelect}
        formatUnreadCount={formatUnreadCount}
      />

      {/* Área do chat (50%) */}
      <ChatPage key={selectedRoomId} roomId={selectedRoomId} roomName={selectedRoomName} />

      {/* Área lateral direita (20%) - AQUI vão os detalhes */}
      <div className="w-[20%]">
        <RoomDetailsPage 
          roomId={selectedRoomId || ""} 
          roomName={selectedRoomName}
        />
      </div>
    </div>
  );
};

export default Home;
