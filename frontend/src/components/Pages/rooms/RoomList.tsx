import React from "react";
import { Search } from "lucide-react";
import { RoomItem } from "./RoomItem";
import type { APIRoom } from "@/types/api";

interface RoomListProps {
  rooms: APIRoom[];
  selectedRoomId?: string;
  unreadCounts: Record<string, number>;
  handleRoomSelect: (room: APIRoom) => void;
  formatUnreadCount: (count: number) => string;
  searchTerm: string;
}

export const RoomList: React.FC<RoomListProps> = ({
  rooms,
  selectedRoomId,
  unreadCounts,
  handleRoomSelect,
  formatUnreadCount,
  searchTerm,
}) => {
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredRooms.length === 0) {
    return (
      <div className="space-y-2 md:space-y-3 overflow-y-auto flex-1 pr-1 md:pr-2 min-h-0">
        <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
          <Search size={48} className="mb-4 opacity-50" />
          {searchTerm ? (
            <>
              <p className="text-lg font-medium mb-2">Nenhuma sala encontrada</p>
              <p className="text-sm text-center">
                Não encontramos salas com o termo "{searchTerm}"
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">Nenhuma sala disponível</p>
              <p className="text-sm text-center">
                Crie uma nova sala para começar a conversar
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3 overflow-y-auto flex-1 pr-1 md:pr-2 min-h-0">
      {filteredRooms.map((room) => (
        <RoomItem
          key={room.id}
          room={room}
          isSelected={selectedRoomId === room.id.toString()}
          unreadCount={unreadCounts[room.id.toString()] || 0}
          onSelect={() => handleRoomSelect(room)}
          formatUnreadCount={formatUnreadCount}
        />
      ))}
    </div>
  );
}; 