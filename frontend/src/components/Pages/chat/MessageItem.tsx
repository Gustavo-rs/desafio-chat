import React from "react";
import { Edit2, Trash2, Check, X, UserCheck, UserMinus, UserPlus, File, Download, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import type { Message } from "@/types/api";
import { useLinkPreview } from "../../../hooks/useLinkPreview";
import { LinkPreview } from "./LinkPreview";

interface MessageItemProps {
  message: Message;
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
  handleImageLoad: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message: msg,
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
  handleImageLoad,
}) => {
  const linkPreviews = useLinkPreview(msg.content);
  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const handleDownloadFile = (file: any) => {
    const downloadUrl = `${import.meta.env.VITE_API_URL}${file.file_url}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (msg.isSystemMessage) {
    return (
      <div className="flex justify-center my-1 md:my-2">
        <div className="bg-blue-50 border border-blue-200 rounded-md px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-blue-700 flex items-center gap-1 md:gap-2">
          {msg.systemMessageType === 'user_joined' ? (
            <UserCheck size={14} className="text-green-600" />
          ) : msg.systemMessageType === 'user_left' ? (
            <UserMinus size={14} className="text-orange-600" />
          ) : msg.systemMessageType === 'member_added' ? (
            <UserPlus size={14} className="text-blue-600" />
          ) : msg.systemMessageType === 'member_removed' ? (
            <UserMinus size={14} className="text-red-600" />
          ) : (
            <UserMinus size={14} className="text-orange-600" />
          )}
          <span className="font-medium">{msg.content}</span>
          <span className="text-xs text-blue-500">
            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-1 md:p-2 rounded-md max-w-[95%] md:max-w-[80%] w-full ${
        msg.user.id === currentUserId ? "ml-auto" : ""
      } group transition-all duration-200 ease-in-out ${
        editingMessageId === msg.id ? "ring-2 ring-violet-300 ring-opacity-50" : ""
      } ${msg.status === 'DELETED' ? "opacity-60" : ""}`}
    >
      <div className={`p-2 md:p-3 rounded-lg break-words transition-all duration-200 overflow-hidden ${
        msg.status === 'DELETED'
          ? "bg-red-50 border border-red-100 border-dashed" 
          : msg.user.id === currentUserId 
            ? "bg-violet-100 hover:bg-violet-50" 
            : "bg-gray-100 hover:bg-gray-50"
      } ${editingMessageId === msg.id ? "bg-violet-50 border-2 border-violet-200" : ""}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center mb-1 md:mb-2">
              <span className="font-semibold text-xs md:text-sm truncate" title={msg.user.id === currentUserId ? "Você" : msg.user.username}>
                {msg.user.id === currentUserId ? "Você" : msg.user.username}
              </span>
              <div className="flex items-center gap-2 justify-end">
                {msg.user.id === currentUserId && editingMessageId !== msg.id && msg.status !== 'DELETED' && (
                  <div className="flex gap-1 md:gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 ease-in-out">
                    <button
                      onClick={() => startEditing(msg.id, msg.content)}
                      className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                      title="Editar mensagem"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                      title="Deletar mensagem"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                {msg.status === 'EDITED' && (
                  <span className="text-xs text-gray-400 italic flex items-center gap-1" title={`Editada às ${msg.updated_at ? new Date(msg.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}`}>
                    <Edit2 size={10} />
                    editada
                  </span>
                )}
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
            
            {editingMessageId === msg.id ? (
              <div className="mt-2 md:mt-3 space-y-2 md:space-y-3">
                <div className="flex items-center gap-2 text-xs text-violet-600 font-medium">
                  <Edit2 size={12} />
                  <span className="hidden sm:inline">Editando mensagem...</span>
                  <span className="sm:hidden">Editando...</span>
                </div>
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full p-2 md:p-3 border-2 border-violet-200 rounded-lg resize-none text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                  rows={2}
                  autoFocus
                  placeholder="Digite sua mensagem..."
                />
                <div className="flex gap-1 md:gap-2 justify-end">
                  <button
                    onClick={() => handleEditMessage(msg.id)}
                    disabled={editingMessage}
                    className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 disabled:hover:scale-100 text-xs md:text-sm font-medium shadow-sm hover:shadow-md"
                    title={editingMessage ? "Salvando..." : "Salvar alterações"}
                  >
                    {editingMessage ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    <span className="hidden sm:inline">
                      {editingMessage ? "Salvando..." : "Salvar"}
                    </span>
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={editingMessage}
                    className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 disabled:hover:scale-100 text-xs md:text-sm font-medium shadow-sm hover:shadow-md"
                    title="Cancelar edição"
                  >
                    <X size={16} />
                    <span className="hidden sm:inline">Cancelar</span>
                  </button>
                </div>
              </div>
            ) : msg.status === 'DELETED' ? (
              <div className="flex items-center gap-2 text-gray-500 italic py-2">
                <Trash2 size={16} className="text-red-400" />
                <span className="text-sm">Esta mensagem foi excluída</span>
              </div>
            ) : (
              <>
                <ReactMarkdown 
                  components={{
                    a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 underline decoration-2 underline-offset-2 transition-colors duration-200" />,
                    code: (props) => <code {...props} className="bg-violet-50 border border-violet-200 px-2 py-1 rounded-md text-sm font-mono text-violet-800" />,
                    blockquote: (props) => <blockquote {...props} className="border-l-4 border-violet-300 pl-4 my-2 italic text-gray-700 bg-violet-25 py-2 rounded-r-md" />,
                    p: (props) => <p {...props} className="mb-1 last:mb-0 leading-relaxed" />,
                    ul: (props) => <ul {...props} className="list-disc list-inside ml-2 space-y-1" />,
                    ol: (props) => <ol {...props} className="list-decimal list-inside ml-2 space-y-1" />,
                    h1: (props) => <h1 {...props} className="text-lg font-bold text-gray-800 mb-2" />,
                    h2: (props) => <h2 {...props} className="text-base font-semibold text-gray-800 mb-1" />,
                    h3: (props) => <h3 {...props} className="text-sm font-semibold text-gray-800 mb-1" />
                  }}
                >
                  {msg.content}
                </ReactMarkdown>

                {linkPreviews.length > 0 && (
                  <div className="space-y-2 w-full overflow-hidden">
                    {linkPreviews.map((preview, index) => (
                      <LinkPreview key={`${preview.url}-${index}`} preview={preview} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {msg.status !== 'DELETED' && (
          <div className="mt-2">
            {msg.files && msg.files.length > 0 && (
              <div className="space-y-2">
                {msg.files.map((file, index) => {
                  return (
                    <div key={file.id || index} className="relative group">
                      {file.file_type?.startsWith('image/') ? (
                        <div className="relative">
                          <img 
                            src={`${import.meta.env.VITE_API_URL}${file.file_url}`} 
                            alt={file.file_name} 
                            className="max-w-full rounded-lg"
                            onLoad={() => handleImageLoad()}
                          />
                          <button
                            onClick={() => handleDownloadFile(file)}
                            className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg"
                            title={`Baixar ${file.file_name}`}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                          <File size={16} className="text-violet-600 flex-shrink-0" />
                          <span className="truncate text-violet-600 flex-1">{file.file_name}</span>
                          <button
                            onClick={() => handleDownloadFile(file)}
                            className="flex items-center justify-center w-8 h-8 bg-violet-100 hover:bg-violet-200 text-violet-600 rounded-lg transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                            title={`Baixar ${file.file_name}`}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 