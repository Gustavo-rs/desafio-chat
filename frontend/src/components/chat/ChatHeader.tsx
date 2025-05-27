import React from "react";
import { Users, Loader2 } from "lucide-react";
import type { OnlineUser } from "@/types/api";

interface ChatHeaderProps {
  roomName?: string;
  userRemovedFromRoom: boolean;
  showOnlineUsers: boolean;
  setShowOnlineUsers: (show: boolean) => void;
  onlineUsers: OnlineUser[];
  loadingUsers: boolean;
  currentUserId?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  roomName,
  userRemovedFromRoom,
  showOnlineUsers,
  setShowOnlineUsers,
  onlineUsers,
  loadingUsers,
  currentUserId,
}) => {
  return (
    <div className="border-b pb-3 md:pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">Chat</h2>
          {roomName && (
            <>
              <span className="text-gray-400">•</span>
              <h3 className="text-base md:text-lg font-medium text-gray-600 truncate">{roomName}</h3>
            </>
          )}
        </div>
      </div>
      
      {!userRemovedFromRoom && (
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => setShowOnlineUsers(!showOnlineUsers)}
            className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {loadingUsers ? (
              <>
                <Loader2 size={16} className="animate-spin text-violet-500" />
              </>
            ) : (
              <>
                <Users size={16} />
                <span className="hidden sm:inline">{onlineUsers.length} usuário{onlineUsers.length !== 1 ? 's' : ''} online</span>
                <span className="sm:hidden">{onlineUsers.length} online</span>
                <span className="text-xs hidden md:inline">({showOnlineUsers ? 'ocultar' : 'mostrar'})</span>
              </>
            )}
          </button>
        </div>
      )}

      {showOnlineUsers && !userRemovedFromRoom && (
        <div className="mt-2 md:mt-3 p-2 md:p-3 bg-gray-50 rounded-lg">
          <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            {loadingUsers ? (
              <>
                <Loader2 size={14} className="animate-spin text-violet-500" />
                <span>Carregando...</span>
              </>
            ) : (
              <>
                <Users size={14} />
                <span className="hidden sm:inline">Usuários Online ({onlineUsers.length})</span>
                <span className="sm:hidden">Online ({onlineUsers.length})</span>
              </>
            )}
          </h4>
          
          {loadingUsers ? (
            <div className="flex items-center justify-center py-2 md:py-4">
              <Loader2 size={20} className="animate-spin text-violet-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 md:gap-2">
              {onlineUsers.map((onlineUser) => (
                <div
                  key={onlineUser.userId}
                  className="flex items-center gap-2 text-xs md:text-sm transition-all duration-200 ease-in-out"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className={`truncate ${onlineUser.userId === currentUserId ? "font-semibold text-violet-700" : "text-gray-700"}`}>
                    {onlineUser.userId === currentUserId ? "Você" : onlineUser.username}
                  </span>
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <p className="text-xs md:text-sm text-gray-500 italic col-span-full">Nenhum usuário online</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 