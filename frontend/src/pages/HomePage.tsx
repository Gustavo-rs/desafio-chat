import React from "react";
import { ResponsiveLayout } from "@/components/home/ResponsiveLayout";
import { useHomePageLogic } from "@/hooks/useHomePageLogic";

const Home: React.FC = () => {
  const {
    rooms,
    isCreatingRoom,
    roomName,
    selectedRoomId,
    selectedRoomName,
    unreadCounts,
    searchTerm,
    open,
    activeTab,
    totalUnreadCount,
    setRoomName,
    setSearchTerm,
    setOpen,
    setActiveTab,
    handleCreateRoom,
    handleRoomSelect,
    formatUnreadCount,
  } = useHomePageLogic();

  return (
    <div className="h-[calc(100vh-8rem)] relative overflow-hidden">
      <ResponsiveLayout
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        selectedRoomName={selectedRoomName}
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalUnreadCount={totalUnreadCount}
      />
    </div>
  );
};

export default Home;
