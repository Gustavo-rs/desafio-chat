import React from "react";
import { MessageSquare, Users } from "lucide-react";
import type { RoomDetails } from "@/types/api";

interface RoomStatsProps {
  roomDetails: RoomDetails;
}

export const RoomStats: React.FC<RoomStatsProps> = ({ roomDetails }) => {
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4">
      <div className="bg-violet-50 rounded-lg p-3 md:p-4 text-center">
        <MessageSquare className="mx-auto mb-1 md:mb-2 text-violet-600" size={24} />
        <p className="text-lg md:text-2xl font-bold text-violet-700">{roomDetails.totalMessages}</p>
        <p className="text-xs md:text-sm text-violet-600">Mensagens</p>
      </div>
      <div className="bg-blue-50 rounded-lg p-3 md:p-4 text-center">
        <Users className="mx-auto mb-1 md:mb-2 text-blue-600" size={24} />
        <p className="text-lg md:text-2xl font-bold text-blue-700">{roomDetails.totalUsers}</p>
        <p className="text-xs md:text-sm text-blue-600">Participantes</p>
      </div>
    </div>
  );
}; 