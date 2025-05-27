import React, { useEffect, useState, useMemo } from "react";
import { useUser } from "../store/auth-store";
import type { APIRoom } from "@/types/api";
import roomsService from "@/services/rooms-service";
import { toast } from "sonner";
import ChatPage from "./chat/ChatPage";
import { useSocket } from "@/contexts/SocketContext";
import { useSocketHomepage } from "@/hooks/useSocketHomepage";
import RoomPage from "./rooms/RoomPage";
import RoomDetailsPage from "./room-details/RoomDetailsPage";
import { MessageSquare, Users, Info } from "lucide-react";

const Home: React.FC = () => {
  const [rooms, setRooms] = useState<APIRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>();
  const [selectedRoomName, setSelectedRoomName] = useState<string>();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'chat' | 'details'>('rooms');
  const [chatInstanceId, setChatInstanceId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 ? 'desktop' : 'mobile';
    }
    return 'desktop';
  });
  const { socket, stopViewingRoom } = useSocket();

  const handleRooms = async () => {
    setLoading(true);

    try {
      const response = await roomsService.list();
      setRooms(response);
      // Initialize unread counts from rooms data
      const counts: Record<string, number> = {};
      response.forEach((room: APIRoom) => {
        counts[room.id.toString()] = room.unreadCount || 0;
      });
      setUnreadCounts(counts);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName) {
      toast.error("Nome da sala é obrigatório");
      return;
    }

    setIsCreatingRoom(true);

    try {
      await roomsService.create({ name: roomName });

      setOpen(false);
      setRoomName("");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Use the custom hook for socket management
  useSocketHomepage({
    selectedRoomId,
    setRooms,
    setUnreadCounts,
    setSelectedRoomId,
    setSelectedRoomName,
    handleRooms
  });

  useEffect(() => {
    handleRooms();
  }, []);

  const handleRoomSelect = (room: APIRoom) => {
    console.log("HomePage: Selecionando sala:", room);
    
    // Se havia uma sala selecionada anteriormente, parar de visualizá-la
    if (selectedRoomId && socket?.connected) {
      stopViewingRoom(selectedRoomId);
    }
    
    setSelectedRoomId(room.id.toString());
    setSelectedRoomName(room.name);
    setActiveTab('chat'); // Automatically switch to chat when a room is selected on mobile
    
    // Determine which ChatPage instance should be active
    const isDesktop = window.innerWidth >= 1024;
    const newInstanceId = isDesktop ? 'desktop' : 'mobile';
    console.log("🎯 Setting chatInstanceId:", newInstanceId, "isDesktop:", isDesktop, "windowWidth:", window.innerWidth);
    setChatInstanceId(newInstanceId);
    setRooms(prev => prev.map(r => ({ ...r, newRoom: r.id === room.id ? false : r.newRoom })));
    setUnreadCounts(prev => {
      const newCounts = {
        ...prev,
        [room.id.toString()]: 0
      };
      console.log("HomePage: Zerando contador para sala", room.id);
      console.log("Novos contadores:", newCounts);
      return newCounts;
    });
  };

  const formatUnreadCount = (count: number) => {
    return count > 99 ? '99+' : count.toString();
  };

  // Add effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (selectedRoomId) {
        const isDesktop = window.innerWidth >= 1024;
        setChatInstanceId(isDesktop ? 'desktop' : 'mobile');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedRoomId]);



  return (
    <div className="h-[calc(100vh-8rem)] relative">


      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full gap-4 relative">
        {/* Lista de salas (30%) */}
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
        />

        {/* Área do chat (50%) */}
        <div className="w-[50%]">
          {(() => {
            console.log("Desktop render check:", { selectedRoomId, chatInstanceId });
            if (selectedRoomId && chatInstanceId === 'desktop') {
              console.log("🖥️ Rendering ChatPage for DESKTOP");
              return <ChatPage key={`desktop-${selectedRoomId}`} roomId={selectedRoomId} roomName={selectedRoomName} />;
            } else if (!selectedRoomId) {
              return (
                <div className="flex items-center justify-center h-full bg-white rounded-lg">
                  <div className="text-center text-gray-500">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Nenhuma sala selecionada</p>
                    <p className="text-sm">Selecione uma sala para começar a conversar</p>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Área lateral direita (20%) - Detalhes */}
        <div className="w-[20%]">
          <RoomDetailsPage 
            roomId={selectedRoomId || ""} 
            roomName={selectedRoomName}
          />
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden flex flex-col h-full">
        {/* Navigation Tabs */}
        <div className="flex bg-white border-b border-gray-200 rounded-t-lg">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'rooms'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={18} />
            <span>Salas</span>
            {Object.values(unreadCounts).reduce((total, count) => total + count, 0) > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                {Object.values(unreadCounts).reduce((total, count) => total + count, 0) > 99 
                  ? '99+' 
                  : Object.values(unreadCounts).reduce((total, count) => total + count, 0)
                }
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('chat')}
            disabled={!selectedRoomId}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                : selectedRoomId 
                  ? 'text-gray-500 hover:text-gray-700' 
                  : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <MessageSquare size={18} />
            <span>Chat</span>
          </button>
          
          <button
            onClick={() => setActiveTab('details')}
            disabled={!selectedRoomId}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                : selectedRoomId 
                  ? 'text-gray-500 hover:text-gray-700' 
                  : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <Info size={18} />
            <span>Detalhes</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'rooms' && (
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
            />
          )}
          
          {activeTab === 'chat' && (() => {
            console.log("Mobile render check:", { selectedRoomId, chatInstanceId, activeTab });
            if (selectedRoomId && chatInstanceId === 'mobile') {
              console.log("📱 Rendering ChatPage for MOBILE");
              return <ChatPage key={`mobile-${selectedRoomId}`} roomId={selectedRoomId} roomName={selectedRoomName} />;
            } else if (!selectedRoomId) {
              return (
                <div className="flex items-center justify-center h-full bg-white">
                  <div className="text-center text-gray-500">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Nenhuma sala selecionada</p>
                    <p className="text-sm">Vá para a aba "Salas" e selecione uma sala para começar a conversar</p>
                  </div>
                </div>
              );
            }
            return null;
          })()}
          
          {activeTab === 'details' && (
            selectedRoomId ? (
              <RoomDetailsPage 
                roomId={selectedRoomId} 
                roomName={selectedRoomName}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-white">
                <div className="text-center text-gray-500">
                  <Info size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhuma sala selecionada</p>
                  <p className="text-sm">Selecione uma sala para ver os detalhes</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
