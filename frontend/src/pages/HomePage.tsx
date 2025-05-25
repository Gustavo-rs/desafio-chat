import React, { useEffect, useState, useRef } from "react";
import { useUser } from "../store/auth-store";
import type { APIRoom, UnreadCount, OnlineUser } from "@/types/api";
import roomsService, { type RoomDetails } from "@/services/rooms-service";
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
import { 
  Loader2, 
  Paperclip, 
  Edit2, 
  Trash2,
  Info,
  Calendar,
  MessageSquare,
  Users,
  File,
  Download,
  Image,
  User
} from "lucide-react";
import ChatPage from "./chat/ChatPage";
import { io } from "socket.io-client";
import { Badge } from "@/components/ui/badge";
import RoomPage from "./rooms/RoomPage";
import RoomMembersManager from "@/components/RoomMembersManager";

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

  // Estados para detalhes da sala (atualizados)
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  // Função para buscar detalhes da sala (atualizada)
  const fetchRoomDetails = async (roomId: string) => {
    setLoadingDetails(true);
    try {
      const response = await roomsService.getRoomDetails(roomId);
      setRoomDetails(response.data);
    } catch (error) {
      console.error('Erro ao buscar detalhes da sala:', error);
      setRoomDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Buscar detalhes quando seleciona uma sala
  useEffect(() => {
    if (selectedRoomId) {
      fetchRoomDetails(selectedRoomId);
    } else {
      setRoomDetails(null);
    }
  }, [selectedRoomId]);

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
      <div className="w-[20%] bg-white rounded-lg shadow-sm p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Info size={20} />
          Detalhes
        </h2>
        
        {!selectedRoomId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Info size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Selecione uma sala para ver os detalhes</p>
            </div>
          </div>
        ) : loadingDetails ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 size={24} className="animate-spin text-violet-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Carregando...</p>
            </div>
          </div>
        ) : roomDetails ? (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Informações básicas */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">Informações</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-500">Nome:</span>
                  <p className="font-medium truncate">{roomDetails.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cri a em:</span>
                  <p className="font-medium">
                    {new Date(roomDetails.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Estatísticas compactas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-violet-50 rounded-lg p-3 text-center">
                <MessageSquare className="mx-auto mb-1 text-violet-600" size={16} />
                <p className="text-lg font-bold text-violet-700">{roomDetails.totalMessages}</p>
                <p className="text-xs text-violet-600">Mensagens</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <Users className="mx-auto mb-1 text-blue-600" size={16} />
                <p className="text-lg font-bold text-blue-700">{roomDetails.totalUsers}</p>
                <p className="text-xs text-blue-600">Participantes</p>
              </div>
            </div>

            {/* Gerenciador de Membros */}
            <div className="bg-gray-50 rounded-lg p-3">
              <RoomMembersManager
                roomId={selectedRoomId}
                members={roomDetails.members || []}
                userRole={roomDetails.userRole}
                onMembersUpdate={() => fetchRoomDetails(selectedRoomId)}
              />
            </div>

            {/* Arquivos compartilhados compactos */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-1">
                <File size={14} />
                Arquivos ({roomDetails.sharedFiles?.length || 0})
              </h3>
              {roomDetails.sharedFiles && roomDetails.sharedFiles.length > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {roomDetails.sharedFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-2 py-1">
                      {file.fileType.startsWith('image/') ? (
                        <Image size={12} className="text-green-600 flex-shrink-0" />
                      ) : (
                        <File size={12} className="text-blue-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{file.fileName}</p>
                        <p className="text-xs text-gray-500">{file.uploadedBy}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const downloadUrl = `${import.meta.env.VITE_API_URL}${file.fileUrl}`;
                          const link = document.createElement('a');
                          link.href = downloadUrl;
                          link.download = file.fileName;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="h-6 w-6 p-0 hover:bg-gray-200"
                        title={`Baixar ${file.fileName}`}
                      >
                        <Download size={10} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-2">
                  Nenhum arquivo
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-500">Erro ao carregar detalhes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
