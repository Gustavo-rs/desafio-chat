import React from "react";
import type { RoomDetails } from "@/types/api";

interface RoomInfoProps {
  roomDetails: RoomDetails;
}

export const RoomInfo: React.FC<RoomInfoProps> = ({ roomDetails }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
      <h3 className="font-semibold text-gray-800 mb-2 md:mb-3 text-sm md:text-base">Informações</h3>
      <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
        <div className="min-w-0">
          <span className="text-gray-500 block mb-1">Nome:</span>
          <p className="font-medium truncate" title={roomDetails.name}>
            {roomDetails.name}
          </p>
        </div>
        <div className="min-w-0">
          <span className="text-gray-500 block mb-1">Criada em:</span>
          <p className="font-medium">
            {new Date(roomDetails.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="min-w-0">
          <span className="text-gray-500 block mb-1">Criador:</span>
          <p className="font-medium truncate" title={roomDetails.creator.username}>
            {roomDetails.creator.username}
          </p>
        </div>
      </div>
    </div>
  );
}; 