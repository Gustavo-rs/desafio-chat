import React from "react";
import { MessageSquare, Users, Info } from "lucide-react";

interface NavigationTabsProps {
  activeTab: "rooms" | "chat" | "details";
  setActiveTab: (tab: "rooms" | "chat" | "details") => void;
  selectedRoomId?: string;
  totalUnreadCount: number;
  formatUnreadCount: (count: number) => string;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  selectedRoomId,
  totalUnreadCount,
  formatUnreadCount,
}) => {
  const getTabClassName = (tab: string, disabled = false) => {
    const baseClasses = "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors";
    
    if (disabled) {
      return `${baseClasses} text-gray-300 cursor-not-allowed`;
    }
    
    if (activeTab === tab) {
      return `${baseClasses} text-violet-600 border-b-2 border-violet-600 bg-violet-50`;
    }
    
    return `${baseClasses} text-gray-500 hover:text-gray-700`;
  };

  return (
    <div className="flex bg-white border-b border-gray-200 rounded-t-lg">
      <button
        onClick={() => setActiveTab("rooms")}
        className={getTabClassName("rooms")}
      >
        <Users size={18} />
        <span>Salas</span>
        {totalUnreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
            {formatUnreadCount(totalUnreadCount)}
          </span>
        )}
      </button>

      <button
        onClick={() => setActiveTab("chat")}
        disabled={!selectedRoomId}
        className={getTabClassName("chat", !selectedRoomId)}
      >
        <MessageSquare size={18} />
        <span>Chat</span>
      </button>

      <button
        onClick={() => setActiveTab("details")}
        disabled={!selectedRoomId}
        className={getTabClassName("details", !selectedRoomId)}
      >
        <Info size={18} />
        <span>Detalhes</span>
      </button>
    </div>
  );
}; 