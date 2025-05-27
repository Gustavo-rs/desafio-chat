import { useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useUser } from '@/store/auth-store';
import type { APIRoom } from '@/types/api';
import { toast } from 'sonner';

interface UseSocketHomepageProps {
  selectedRoomId?: string;
  setRooms: React.Dispatch<React.SetStateAction<APIRoom[]>>;
  setUnreadCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setSelectedRoomId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setSelectedRoomName: React.Dispatch<React.SetStateAction<string | undefined>>;
  handleRooms: () => Promise<void>;
}

export const useSocketHomepage = ({
  selectedRoomId,
  setRooms,
  setUnreadCounts,
  setSelectedRoomId,
  setSelectedRoomName,
  handleRooms
}: UseSocketHomepageProps) => {
  const { socket, isConnected, stopViewingRoom } = useSocket();
  const { user } = useUser();

  // Use refs for stable callbacks
  const setRoomsRef = useRef(setRooms);
  const setUnreadCountsRef = useRef(setUnreadCounts);
  const setSelectedRoomIdRef = useRef(setSelectedRoomId);
  const setSelectedRoomNameRef = useRef(setSelectedRoomName);
  const handleRoomsRef = useRef(handleRooms);

  // Update refs when callbacks change
  useEffect(() => {
    setRoomsRef.current = setRooms;
    setUnreadCountsRef.current = setUnreadCounts;
    setSelectedRoomIdRef.current = setSelectedRoomId;
    setSelectedRoomNameRef.current = setSelectedRoomName;
    handleRoomsRef.current = handleRooms;
  }, [setRooms, setUnreadCounts, setSelectedRoomId, setSelectedRoomName, handleRooms]);

  useEffect(() => {
    if (!user || !socket || !isConnected) return;

    console.log("useSocketHomepage: Configurando listeners do socket");

    const handleConnect = () => {
      console.log("useSocketHomepage: Socket conectado com ID:", socket.id);
    };

    const handleConnectError = (error: any) => {
      console.error("useSocketHomepage: Erro na conexão do socket:", error);
    };

    const handleRoomCreated = (newRoom: APIRoom) => {
      console.log("useSocketHomepage: Nova sala criada:", newRoom);
      const newRoomWithNew = { ...newRoom, newRoom: true };
      setRoomsRef.current(prev => [newRoomWithNew, ...prev]);
    };

    const handleRoomDeleted = (deletedRoom: { id: string }) => {
      console.log("useSocketHomepage: Sala deletada:", deletedRoom);
      setRoomsRef.current(prev => prev.filter(room => room.id !== deletedRoom.id));
      if (selectedRoomId === deletedRoom.id) {
        setSelectedRoomIdRef.current(undefined);
        setSelectedRoomNameRef.current(undefined);
      }
    };

    const handleUnreadMessage = ({ roomId, lastMessage }: { roomId: string; lastMessage: any }) => {
      console.log("useSocketHomepage: Recebida notificação de mensagem não lida");
      console.log("Sala:", roomId);
      console.log("Sala selecionada:", selectedRoomId);
      
      // Não incrementar contador se a mensagem for da sala atualmente selecionada
      if (selectedRoomId && selectedRoomId === roomId.toString()) {
        console.log("useSocketHomepage: Mensagem da sala atual, não incrementando contador");
      } else {
        setUnreadCountsRef.current(prev => {
          const newCount = (prev[roomId.toString()] || 0) + 1;
          console.log("Novo contador calculado:", newCount);
          const newCounts = {
            ...prev,
            [roomId.toString()]: newCount
          };
          console.log("Novos contadores:", newCounts);
          return newCounts;
        });
      }

      // Atualiza a última mensagem da sala e move para o topo
      setRoomsRef.current(prev => {
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
    };

    const handleReceiveMessage = ({ roomId, message }: { roomId: string; message: any }) => {
      // Atualiza a última mensagem da sala e move para o topo para o usuário que enviou
      console.log("useSocketHomepage: Recebida mensagem:", message);
      setRoomsRef.current(prev => {
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
    };

    const handleMessagesRead = ({ roomId }: { roomId: string }) => {
      console.log("useSocketHomepage: Mensagens marcadas como lidas");
      console.log("Sala:", roomId);
      
      setUnreadCountsRef.current(prev => {
        const newCounts = {
          ...prev,
          [roomId.toString()]: 0
        };
        console.log("Novos contadores após leitura:", newCounts);
        return newCounts;
      });
    };

    const handleMemberAdded = ({ roomId, member }: { roomId: string; member: any }) => {
      console.log("useSocketHomepage: Membro adicionado à sala:", roomId, member);
      
      // Se o usuário atual foi adicionado, buscar a sala e adicioná-la à lista
      if (member.user.id === user?.user?.id) {
        console.log("useSocketHomepage: Usuário atual foi adicionado à sala, recarregando lista");
        handleRoomsRef.current(); // Recarregar lista de salas
        toast.success(`Você foi adicionado à sala "${member.room.name}"`);
      }
    };

    const handleMemberRemoved = ({ roomId, removedUserId }: { roomId: string; removedUserId: string }) => {
      console.log("useSocketHomepage: Membro removido da sala:", roomId, removedUserId);
      
      // Se o usuário atual foi removido, remover a sala da lista
      if (removedUserId === user?.user?.id) {
        console.log("useSocketHomepage: Usuário atual foi removido da sala, removendo da lista");
        setRoomsRef.current(prev => prev.filter(room => room.id !== roomId));
        
        // Se estava visualizando a sala removida, limpar seleção
        if (selectedRoomId === roomId) {
          setSelectedRoomIdRef.current(undefined);
          setSelectedRoomNameRef.current(undefined);
        }
        
        // Remover contador de não lidas
        setUnreadCountsRef.current(prev => {
          const newCounts = { ...prev };
          delete newCounts[roomId.toString()];
          return newCounts;
        });
        
        toast.error("Você foi removido da sala");
      }
    };

    // Registrar listeners
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("room_created", handleRoomCreated);
    socket.on("room_deleted", handleRoomDeleted);
    socket.on("unread_message", handleUnreadMessage);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("messages_read", handleMessagesRead);
    socket.on("member_added", handleMemberAdded);
    socket.on("member_removed", handleMemberRemoved);

    return () => {
      console.log("useSocketHomepage: Removendo listeners do socket");
      
      // Parar de visualizar a sala atual se houver uma selecionada
      if (selectedRoomId && socket?.connected) {
        stopViewingRoom(selectedRoomId);
      }
      
      // Remover todos os listeners
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("room_created", handleRoomCreated);
      socket.off("room_deleted", handleRoomDeleted);
      socket.off("unread_message", handleUnreadMessage);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("messages_read", handleMessagesRead);
      socket.off("member_added", handleMemberAdded);
      socket.off("member_removed", handleMemberRemoved);
    };
  }, [user, socket, isConnected, selectedRoomId, stopViewingRoom]);
}; 