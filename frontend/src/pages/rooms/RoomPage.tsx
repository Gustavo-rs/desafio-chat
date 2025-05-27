
import type { APIRoom } from "@/types/api";
import { RoomHeader } from "@/components/rooms/RoomHeader";
import { RoomSearch } from "@/components/rooms/RoomSearch";
import { RoomList } from "@/components/rooms/RoomList";

interface RoomPageProps {
  rooms: APIRoom[];
  selectedRoomId?: string;
  unreadCounts: Record<string, number>;
  open: boolean;
  setOpen: (open: boolean) => void;
  roomName: string;
  setRoomName: (name: string) => void;
  isCreatingRoom: boolean;
  handleCreateRoom: () => void;
  handleRoomSelect: (room: APIRoom) => void;
  formatUnreadCount: (count: number) => string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function RoomPage({
  rooms,
  selectedRoomId,
  unreadCounts,
  open,
  setOpen,
  roomName,
  setRoomName,
  isCreatingRoom,
  handleCreateRoom,
  handleRoomSelect,
  formatUnreadCount,
  searchTerm,
  setSearchTerm
}: RoomPageProps) {
  return (
    <div className="w-full h-full p-3 md:p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
      <RoomHeader
        open={open}
        setOpen={setOpen}
        roomName={roomName}
        setRoomName={setRoomName}
        isCreatingRoom={isCreatingRoom}
        handleCreateRoom={handleCreateRoom}
      />

      <RoomSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <RoomList
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        unreadCounts={unreadCounts}
        handleRoomSelect={handleRoomSelect}
        formatUnreadCount={formatUnreadCount}
        searchTerm={searchTerm}
      />
    </div>
  );
}