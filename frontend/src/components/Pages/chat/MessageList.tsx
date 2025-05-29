import React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { MessageItem } from "./MessageItem";
import type { Message } from "@/types/api";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  page: number;
  userRemovedFromRoom: boolean;
  currentUserId?: string;
  editingMessageId: string | null;
  editingContent: string;
  editingMessage: boolean;
  setEditingContent: (content: string) => void;
  startEditing: (messageId: string, currentContent: string) => void;
  cancelEditing: () => void;
  handleEditMessage: (messageId: string) => void;
  setMessageToDelete: (messageId: string | null) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  bottomRef: React.RefObject<HTMLDivElement>;
  handleScroll: () => void;
  handleImageLoad: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  page,
  userRemovedFromRoom,
  currentUserId,
  editingMessageId,
  editingContent,
  editingMessage,
  setEditingContent,
  startEditing,
  cancelEditing,
  handleEditMessage,
  setMessageToDelete,
  setDeleteDialogOpen,
  messagesContainerRef,
  bottomRef,
  handleScroll,
  handleImageLoad,
}) => {
  if (userRemovedFromRoom) {
    return (
      <div className="flex-1 py-2 md:py-4 space-y-1 md:space-y-2 overflow-y-auto min-h-0">
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center text-red-500 bg-red-50 border border-red-200 rounded-lg p-4 md:p-6 max-w-sm md:max-w-md">
            <AlertTriangle size={40} className="mx-auto mb-3 md:mb-4 text-red-400" />
            <h3 className="text-base md:text-lg font-semibold mb-2">Acesso Removido</h3>
            <p className="text-xs md:text-sm text-red-600">
              Você foi removido desta sala e não pode mais visualizar ou enviar mensagens.
            </p>
            <p className="text-xs text-red-500 mt-2">
              Selecione outra sala para continuar conversando.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={messagesContainerRef} 
      className="flex-1 py-2 md:py-4 space-y-1 md:space-y-2 overflow-y-auto min-h-0"
      onScroll={handleScroll}
    >
      {loading && page > 1 && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      )}
      
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500 text-sm md:text-base">Nenhuma mensagem encontrada nesta sala</p>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <MessageItem
            key={idx}
            message={msg}
            currentUserId={currentUserId}
            editingMessageId={editingMessageId}
            editingContent={editingContent}
            editingMessage={editingMessage}
            setEditingContent={setEditingContent}
            startEditing={startEditing}
            cancelEditing={cancelEditing}
            handleEditMessage={handleEditMessage}
            setMessageToDelete={setMessageToDelete}
            setDeleteDialogOpen={setDeleteDialogOpen}
            handleImageLoad={handleImageLoad}
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}; 