import { useState, useEffect } from "react";
import roomsService from "@/services/rooms-service";
import type { RoomDetails } from "@/types/api";

interface UseRoomDetailsLogicProps {
  roomId: string;
}

export const useRoomDetailsLogic = ({ roomId }: UseRoomDetailsLogicProps) => {
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchRoomDetails = async (id: string) => {
    if (!id) return;
    
    setLoadingDetails(true);
    try {
      const response = await roomsService.getRoomDetails(id);
      setRoomDetails(response.data);
    } catch (error) {
      console.error("Erro ao buscar detalhes da sala:", error);
      setRoomDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails(roomId);
    }
  }, [roomId]);

  return {
    roomDetails,
    loadingDetails,
    fetchRoomDetails,
  };
}; 