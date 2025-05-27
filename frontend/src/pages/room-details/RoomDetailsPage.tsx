import React from "react";
import { Loader2 } from "lucide-react";
import { RoomDetailsHeader } from "@/components/room-details/RoomDetailsHeader";
import { RoomInfo } from "@/components/room-details/RoomInfo";
import { RoomStats } from "@/components/room-details/RoomStats";
import { SharedFiles } from "@/components/room-details/SharedFiles";
import RoomMembersManager from "@/components/RoomMembersManager";
import { useRoomDetailsLogic } from "@/hooks/useRoomDetailsLogic";

interface RoomDetailsPageProps {
  roomId: string;
  roomName?: string;
}

export default function RoomDetailsPage({ roomId, roomName }: RoomDetailsPageProps) {
  const { roomDetails, loadingDetails, fetchRoomDetails } = useRoomDetailsLogic({ roomId });

  if (!roomId) {
    return <RoomDetailsHeader roomId={roomId} />;
  }

  if (loadingDetails) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm p-3 md:p-4 flex flex-col">
        <RoomDetailsHeader roomId={roomId} />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={24} className="animate-spin text-violet-500 mx-auto mb-2" />
            <p className="text-xs md:text-sm text-gray-500">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!roomDetails) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm p-3 md:p-4 flex flex-col">
        <RoomDetailsHeader roomId={roomId} />
        
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs md:text-sm text-gray-500">Erro ao carregar detalhes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg shadow-sm p-3 md:p-4 flex flex-col">
      <RoomDetailsHeader roomId={roomId} />
      
      <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 min-h-0">
        {/* Informações básicas */}
        <RoomInfo roomDetails={roomDetails} />

        {/* Estatísticas */}
        <RoomStats roomDetails={roomDetails} />

        {/* Gerenciador de Membros */}
        <div className="bg-gray-50 rounded-lg p-4">
          <RoomMembersManager
            roomId={roomId}
            members={roomDetails.members || []}
            userRole={roomDetails.userRole}
            onMembersUpdate={() => fetchRoomDetails(roomId)}
          />
        </div>

        {/* Arquivos compartilhados */}
        <SharedFiles roomDetails={roomDetails} />
      </div>
    </div>
  );
} 