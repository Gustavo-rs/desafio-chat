import React from "react";
import { DesktopLayout } from "@/components/home/DesktopLayout";
import { MobileLayout } from "@/components/home/MobileLayout";
import { useHomePageLogic } from "@/hooks/useHomePageLogic";

const Home: React.FC = () => {
  const {
    // State
    rooms,
    loading,
    isCreatingRoom,
    roomName,
    selectedRoomId,
    selectedRoomName,
    unreadCounts,
    searchTerm,
    open,
    activeTab,
    totalUnreadCount,
    user,
    
    // Setters
    setRoomName,
    setSearchTerm,
    setOpen,
    setActiveTab,
    
    // Handlers
    handleCreateRoom,
    handleRoomSelect,
    formatUnreadCount,
  } = useHomePageLogic();

  const commonProps = {
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
  };

  return (
    <div className="h-[calc(100vh-8rem)] relative">
      {/* Desktop Layout */}
      <DesktopLayout {...commonProps} />

      {/* Mobile/Tablet Layout */}
      <MobileLayout
        {...commonProps}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalUnreadCount={totalUnreadCount}
      />
    </div>
  );
};

export default Home;
