import React from "react";
import { MessageSquare } from "lucide-react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { DeleteMessageDialog } from "@/components/chat/DeleteMessageDialog";
import { useChatPageLogic } from "@/hooks/useChatPageLogic";
import type { ChatPageProps } from "@/types/api";

export default function ChatPage({ roomId = "", roomName = "" }: ChatPageProps) {
  const {
    messages,
    input, 
    selectedFiles,
    page,
    loading,
    editingMessageId,
    editingContent,
    deleteDialogOpen,
    deletingMessage,
    editingMessage,
    userRemovedFromRoom,
    onlineUsers,
    showOnlineUsers,
    loadingUsers,
    user,
    typingUsers,
    fileInputRef,
    messagesContainerRef,
    bottomRef,
    setInput,
    setEditingContent,
    setMessageToDelete,
    setDeleteDialogOpen,
    setShowOnlineUsers,
    handleFileSelect,
    removeSelectedFile,
    clearAllFiles,
    sendMessage,
    confirmDeleteMessage,
    cancelDeleteMessage,
    handleEditMessage,
    startEditing,
    cancelEditing,
    handleScroll,
    handleTyping,
    stopTyping,
    handleImageLoad,
  } = useChatPageLogic({ roomId: roomId || "" });

  if (!roomId) {
    return (
      <div className="w-full h-full bg-white rounded-lg shadow-sm p-3 md:p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Nenhuma sala selecionada</p>
          <p className="text-sm">Selecione uma sala para começar a conversar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-sm p-3 md:p-4">
      <div className="h-full flex flex-col">
        <ChatHeader
          roomName={roomName}
          userRemovedFromRoom={userRemovedFromRoom}
          showOnlineUsers={showOnlineUsers}
          setShowOnlineUsers={setShowOnlineUsers}
          onlineUsers={onlineUsers}
          loadingUsers={loadingUsers}
          currentUserId={user?.user?.id}
        />

        <MessageList
          messages={messages}
          loading={loading}
          page={page}
          userRemovedFromRoom={userRemovedFromRoom}
          currentUserId={user?.user?.id}
          editingMessageId={editingMessageId}
          editingContent={editingContent}
          editingMessage={editingMessage}
          setEditingContent={setEditingContent}
          startEditing={startEditing}
          cancelEditing={cancelEditing}
          handleEditMessage={handleEditMessage}
          setMessageToDelete={setMessageToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          messagesContainerRef={messagesContainerRef as React.RefObject<HTMLDivElement>}
          bottomRef={bottomRef as React.RefObject<HTMLDivElement>}
          handleScroll={handleScroll}
          handleImageLoad={handleImageLoad}
        />

        <TypingIndicator typingUsers={typingUsers} />

        <MessageInput
          input={input}
          setInput={setInput}
          selectedFiles={selectedFiles}
          removeSelectedFile={removeSelectedFile}
          clearAllFiles={clearAllFiles}
          sendMessage={sendMessage}
          fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
          handleFileSelect={handleFileSelect}
          userRemovedFromRoom={userRemovedFromRoom}
          handleTyping={handleTyping}
          stopTyping={stopTyping}
        />

        <DeleteMessageDialog
          open={deleteDialogOpen}
          onConfirm={confirmDeleteMessage}
          onCancel={cancelDeleteMessage}
          isLoading={deletingMessage}
        />
      </div>
    </div>
  );
}
