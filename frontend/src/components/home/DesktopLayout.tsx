import React from "react";
import RoomPage from "@/pages/rooms/RoomPage";
import ChatPage from "@/pages/chat/ChatPage";
import RoomDetailsPage from "@/pages/room-details/RoomDetailsPage";
import { EmptyState } from "./EmptyState";
import type { APIRoom } from "@/types/api";

interface DesktopLayoutProps {
  rooms: APIRoom[];
  selectedRoomId?: string;
  selectedRoomName?: string;
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

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  rooms,
  selectedRoomId,
  selectedRoomName,
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
  setSearchTerm,
}) => {
  return (
    <div className="hidden lg:flex h-full gap-4 relative">
      {/* Lista de salas (30%) */}
      <div className="w-[30%]">
        <RoomPage
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          unreadCounts={unreadCounts}
          open={open}
          setOpen={setOpen}
          roomName={roomName}
          setRoomName={setRoomName}
          isCreatingRoom={isCreatingRoom}
          handleCreateRoom={handleCreateRoom}
          handleRoomSelect={handleRoomSelect}
          formatUnreadCount={formatUnreadCount}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>

      {/* Área do chat (50%) */}
      <div className="w-[50%]">
        {selectedRoomId ? (
          <ChatPage roomId={selectedRoomId} roomName={selectedRoomName} />
        ) : (
          <EmptyState
            message="Nenhuma sala selecionada"
            subtitle="Selecione uma sala para começar a conversar"
          />
        )}
      </div>

      {/* Área lateral direita (20%) - Detalhes */}
      <div className="w-[20%]">
        <RoomDetailsPage
          roomId={selectedRoomId || ""}
          roomName={selectedRoomName}
        />
      </div>
    </div>
  );
}; 