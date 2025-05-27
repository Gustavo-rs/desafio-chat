import { useEffect, useState } from "react";
import { useUser } from "@/store/auth-store";
import { useSocket } from "@/contexts/SocketContext";
import { useSocketHomepage } from "@/hooks/useSocketHomepage";
import roomsService from "@/services/rooms-service";
import { toast } from "sonner";
import type { APIRoom } from "@/types/api";

export const useHomePageLogic = () => {
  const [rooms, setRooms] = useState<APIRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>();
  const [selectedRoomName, setSelectedRoomName] = useState<string>();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"rooms" | "chat" | "details">("rooms");

  const { user } = useUser();
  const { socket, stopViewingRoom } = useSocket();

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

  const handleRoomSelect = (room: APIRoom) => {
    // Se havia uma sala selecionada anteriormente, parar de visualizá-la
    if (selectedRoomId && socket?.connected) {
      stopViewingRoom(selectedRoomId);
    }

    setSelectedRoomId(room.id.toString());
    setSelectedRoomName(room.name);
    setActiveTab("chat"); // Automatically switch to chat when a room is selected on mobile

    // Mark room as read and remove new room indicator
    setRooms((prev) =>
      prev.map((r) => ({ ...r, newRoom: r.id === room.id ? false : r.newRoom }))
    );
    setUnreadCounts((prev) => ({
      ...prev,
      [room.id.toString()]: 0,
    }));
  };

  const formatUnreadCount = (count: number) => {
    return count > 99 ? "99+" : count.toString();
  };

  const totalUnreadCount = Object.entries(unreadCounts).reduce(
    (total, [roomId, count]) => {
      // Não incluir a sala atualmente selecionada no contador total
      if (selectedRoomId && selectedRoomId === roomId) {
        return total;
      }
      return total + count;
    },
    0
  );

  // Use the custom hook for socket management
  useSocketHomepage({
    selectedRoomId,
    setRooms,
    setUnreadCounts,
    setSelectedRoomId,
    setSelectedRoomName,
    handleRooms,
  });

  useEffect(() => {
    handleRooms();
  }, []);

  return {
    // State
    rooms,
    loading,
    isCreatingRoom,
    roomName,
    selectedRoomId,
    selectedRoomName,
    unreadCounts,
    searchTerm,
    open,
    activeTab,
    totalUnreadCount,
    user,
    
    // Setters
    setRoomName,
    setSearchTerm,
    setOpen,
    setActiveTab,
    
    // Handlers
    handleCreateRoom,
    handleRoomSelect,
    formatUnreadCount,
  };
}; 