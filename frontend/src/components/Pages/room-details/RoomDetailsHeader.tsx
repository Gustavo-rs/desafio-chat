import React from "react";
import { Info } from "lucide-react";

interface RoomDetailsHeaderProps {
  roomId: string;
}

export const RoomDetailsHeader: React.FC<RoomDetailsHeaderProps> = ({ roomId }) => {
  if (!roomId) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm p-3 md:p-4 flex flex-col">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
          <Info size={20} />
          Detalhes da Sala
        </h2>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Info size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs md:text-sm">Selecione uma sala para ver os detalhes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
      <Info size={20} />
      Detalhes da Sala
    </h2>
  );
}; 