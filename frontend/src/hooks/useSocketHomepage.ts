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

  const setRoomsRef = useRef(setRooms);
  const setUnreadCountsRef = useRef(setUnreadCounts);
  const setSelectedRoomIdRef = useRef(setSelectedRoomId);
  const setSelectedRoomNameRef = useRef(setSelectedRoomName);
  const handleRoomsRef = useRef(handleRooms);

  useEffect(() => {
    setRoomsRef.current = setRooms;
    setUnreadCountsRef.current = setUnreadCounts;
    setSelectedRoomIdRef.current = setSelectedRoomId;
    setSelectedRoomNameRef.current = setSelectedRoomName;
    handleRoomsRef.current = handleRooms;
  }, [setRooms, setUnreadCounts, setSelectedRoomId, setSelectedRoomName, handleRooms]);

  useEffect(() => {
    if (!user || !socket || !isConnected) return;

    const handleRoomCreated = (newRoom: APIRoom) => {
      const newRoomWithNew = { ...newRoom, newRoom: true };
      setRoomsRef.current(prev => [newRoomWithNew, ...prev]);
    };

    const handleRoomDeleted = (deletedRoom: { id: string }) => {
      setRoomsRef.current(prev => prev.filter(room => room.id !== deletedRoom.id));
      if (selectedRoomId === deletedRoom.id) {
        setSelectedRoomIdRef.current(undefined);
        setSelectedRoomNameRef.current(undefined);
      }
    };

    const handleUnreadMessage = ({ roomId, lastMessage }: { roomId: string; lastMessage: any }) => {
      if (selectedRoomId && selectedRoomId === roomId.toString()) return;

      setUnreadCountsRef.current(prev => ({
        ...prev,
        [roomId.toString()]: (prev[roomId.toString()] || 0) + 1
      }));

      setRoomsRef.current(prev => {
        const updatedRooms = prev.map(room => {
          if (room.id === roomId) {
            return { ...room, lastMessage };
          }
          return room;
        });
        
        const roomIndex = updatedRooms.findIndex(room => room.id === roomId);
        if (roomIndex > -1) {
          const [updatedRoom] = updatedRooms.splice(roomIndex, 1);
          updatedRooms.unshift(updatedRoom);
        }
        
        return updatedRooms;
      });
    };

    const handleReceiveMessage = ({ roomId, message }: { roomId: string; message: any }) => {
      setRoomsRef.current(prev => {
        const updatedRooms = prev.map(room => {
          if (room.id === roomId) {
            return { ...room, lastMessage: message };
          }
          return room;
        });
        
        const roomIndex = updatedRooms.findIndex(room => room.id === roomId);
        if (roomIndex > -1) {
          const [updatedRoom] = updatedRooms.splice(roomIndex, 1);
          updatedRooms.unshift(updatedRoom);
        }
        
        return updatedRooms;
      });
    };

    const handleMessagesRead = ({ roomId }: { roomId: string }) => {
      setUnreadCountsRef.current(prev => ({
        ...prev,
        [roomId.toString()]: 0
      }));
    };

    const handleMemberAdded = ({ roomId, member }: { roomId: string; member: any }) => {
      if (member.user.id === user?.user?.id) {
        handleRoomsRef.current();
        toast.success(`Você foi adicionado à sala "${member.room.name}"`);
      }
    };

    const handleMemberRemoved = ({ roomId, removedUserId }: { roomId: string; removedUserId: string }) => {
      if (removedUserId === user?.user?.id) {
        setRoomsRef.current(prev => prev.filter(room => room.id !== roomId));
        
        if (selectedRoomId === roomId) {
          setSelectedRoomIdRef.current(undefined);
          setSelectedRoomNameRef.current(undefined);
        }
        
        setUnreadCountsRef.current(prev => {
          const newCounts = { ...prev };
          delete newCounts[roomId.toString()];
          return newCounts;
        });
        
        toast.error("Você foi removido da sala");
      }
    };

    socket.on("connect", () => {});
    socket.on("connect_error", () => {});
    socket.on("room_created", handleRoomCreated);
    socket.on("room_deleted", handleRoomDeleted);
    socket.on("unread_message", handleUnreadMessage);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("messages_read", handleMessagesRead);
    socket.on("member_added", handleMemberAdded);
    socket.on("member_removed", handleMemberRemoved);

    return () => {
      if (selectedRoomId && socket?.connected) {
        stopViewingRoom(selectedRoomId);
      }
      
      socket.off("connect");
      socket.off("connect_error");
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