import React from "react";
import RoomPage from "@/pages/rooms/RoomPage";
import ChatPage from "@/pages/chat/ChatPage";
import RoomDetailsPage from "@/pages/room-details/RoomDetailsPage";
import { EmptyState } from "./EmptyState";
import { NavigationTabs } from "./NavigationTabs";
import type { APIRoom } from "@/types/api";

interface MobileLayoutProps {
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
  activeTab: "rooms" | "chat" | "details";
  setActiveTab: (tab: "rooms" | "chat" | "details") => void;
  totalUnreadCount: number;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
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
  activeTab,
  setActiveTab,
  totalUnreadCount,
}) => {
  return (
    <div className="lg:hidden flex flex-col h-full">
      {/* Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedRoomId={selectedRoomId}
        totalUnreadCount={totalUnreadCount}
        formatUnreadCount={formatUnreadCount}
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "rooms" && (
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
        )}

        {activeTab === "chat" && !selectedRoomId && (
          <EmptyState
            message="Nenhuma sala selecionada"
            subtitle='Vá para a aba "Salas" e selecione uma sala para começar a conversar'
          />
        )}

        {activeTab === "chat" && selectedRoomId && (
          <ChatPage roomId={selectedRoomId} roomName={selectedRoomName} />
        )}

        {activeTab === "details" && !selectedRoomId && (
          <EmptyState
            message="Nenhuma sala selecionada"
            subtitle="Selecione uma sala para ver os detalhes"
          />
        )}

        {activeTab === "details" && selectedRoomId && (
          <RoomDetailsPage
            roomId={selectedRoomId}
            roomName={selectedRoomName}
          />
        )}
      </div>
    </div>
  );
}; 