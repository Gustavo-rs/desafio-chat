import React from "react";
import RoomPage from "@/pages/rooms/RoomPage";
import ChatPage from "@/pages/chat/ChatPage";
import RoomDetailsPage from "@/pages/room-details/RoomDetailsPage";
import { EmptyState } from "./EmptyState";
import { NavigationTabs } from "./NavigationTabs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { APIRoom } from "@/types/api";

interface ResponsiveLayoutProps {
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

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
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
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Determinar quando mostrar o chat
  const shouldShowChat = selectedRoomId && (
    isDesktop || // Desktop: sempre mostrar se há sala selecionada
    (!isDesktop && activeTab === "chat") // Mobile: só mostrar na tab chat
  );

  return (
    <div className="h-full relative">
      {/* Desktop Layout - 3 colunas lado a lado */}
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
          {shouldShowChat && isDesktop ? (
            <ChatPage roomId={selectedRoomId} roomName={selectedRoomName} />
          ) : !selectedRoomId ? (
            <EmptyState
              message="Nenhuma sala selecionada"
              subtitle="Selecione uma sala para começar a conversar"
            />
          ) : null}
        </div>

        {/* Área lateral direita (20%) - Detalhes */}
        <div className="w-[20%]">
          <RoomDetailsPage
            roomId={selectedRoomId || ""}
            roomName={selectedRoomName}
          />
        </div>
      </div>

      {/* Mobile Layout - Tabs */}
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

          {activeTab === "chat" && shouldShowChat && !isDesktop && (
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
    </div>
  );
}; 