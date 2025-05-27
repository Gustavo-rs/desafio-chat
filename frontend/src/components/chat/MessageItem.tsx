import React from "react";
import { Edit2, Trash2, Check, X, UserCheck, UserMinus, UserPlus, File } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import type { Message } from "@/types/api";

interface MessageItemProps {
  message: Message;
  currentUserId?: string;
  editingMessageId: string | null;
  editingContent: string;
  setEditingContent: (content: string) => void;
  startEditing: (messageId: string, currentContent: string) => void;
  cancelEditing: () => void;
  handleEditMessage: (messageId: string) => void;
  setMessageToDelete: (messageId: string | null) => void;
  setDeleteDialogOpen: (open: boolean) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message: msg,
  currentUserId,
  editingMessageId,
  editingContent,
  setEditingContent,
  startEditing,
  cancelEditing,
  handleEditMessage,
  setMessageToDelete,
  setDeleteDialogOpen,
}) => {
  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  // Renderização especial para mensagens do sistema
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

  // Renderização normal para mensagens de usuário
  return (
    <div
      className={`p-1 md:p-2 rounded-md max-w-[90%] md:max-w-[80%] ${
        msg.user.id === currentUserId ? "ml-auto" : ""
      } group transition-all duration-200 ease-in-out ${
        editingMessageId === msg.id ? "ring-2 ring-violet-300 ring-opacity-50" : ""
      } ${msg.status === 'DELETED' ? "opacity-60" : ""}`}
    >
      <div className={`p-2 md:p-3 rounded-lg break-words transition-all duration-200 ${
        msg.status === 'DELETED'
          ? "bg-red-50 border border-red-100 border-dashed" 
          : msg.user.id === currentUserId 
            ? "bg-violet-100 hover:bg-violet-50" 
            : "bg-gray-100 hover:bg-gray-50"
      } ${editingMessageId === msg.id ? "bg-violet-50 border-2 border-violet-200" : ""}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1 md:mb-2">
              <span className="font-semibold text-xs md:text-sm truncate">
                {msg.user.id === currentUserId ? "Você" : msg.user.username}
              </span>
              <div className="flex items-center gap-2">
                {/* Botões de ação para mensagens próprias - apenas se não for deletada */}
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
                {/* Indicador de mensagem editada */}
                {msg.status === 'EDITED' && (
                  <span className="text-xs text-gray-400 italic flex items-center gap-1" title={`Editada às ${msg.updated_at ? new Date(msg.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}`}>
                    <Edit2 size={10} />
                    editada
                  </span>
                )}
                <span className="text-xs text-gray-500">
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
                    className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 text-xs md:text-sm font-medium shadow-sm hover:shadow-md"
                    title="Salvar alterações"
                  >
                    <Check size={16} />
                    <span className="hidden sm:inline">Salvar</span>
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 text-xs md:text-sm font-medium shadow-sm hover:shadow-md"
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
              <ReactMarkdown 
                components={{
                  // Links abrem em nova aba
                  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 underline decoration-2 underline-offset-2 transition-colors duration-200" />,
                  // Código inline com estilo
                  code: (props) => <code {...props} className="bg-violet-50 border border-violet-200 px-2 py-1 rounded-md text-sm font-mono text-violet-800" />,
                  // Citações com estilo
                  blockquote: (props) => <blockquote {...props} className="border-l-4 border-violet-300 pl-4 my-2 italic text-gray-700 bg-violet-25 py-2 rounded-r-md" />,
                  // Quebras de linha
                  p: (props) => <p {...props} className="mb-1 last:mb-0 leading-relaxed" />,
                  // Listas
                  ul: (props) => <ul {...props} className="list-disc list-inside ml-2 space-y-1" />,
                  ol: (props) => <ol {...props} className="list-decimal list-inside ml-2 space-y-1" />,
                  // Headers
                  h1: (props) => <h1 {...props} className="text-lg font-bold text-gray-800 mb-2" />,
                  h2: (props) => <h2 {...props} className="text-base font-semibold text-gray-800 mb-1" />,
                  h3: (props) => <h3 {...props} className="text-sm font-semibold text-gray-800 mb-1" />
                }}
              >
                {msg.content}
              </ReactMarkdown>
            )}
          </div>
        </div>
        
        {/* Arquivos anexos - só mostrar se a mensagem não foi deletada */}
        {msg.status !== 'DELETED' && (
          <div className="mt-2">
            {/* Múltiplos arquivos (novo formato) */}
            {msg.files && msg.files.length > 0 && (
              <div className="space-y-2">
                {msg.files.map((file, index) => {
                  console.log('Arquivo:', file, 'URL completa:', `${import.meta.env.VITE_API_URL}${file.file_url}`);
                  return (
                    <div key={file.id || index}>
                      {file.file_type?.startsWith('image/') ? (
                        <img 
                          src={`${import.meta.env.VITE_API_URL}${file.file_url}`} 
                          alt={file.file_name} 
                          className="max-w-full rounded-lg"
                          onError={(e) => console.error('Erro ao carregar imagem:', e.currentTarget.src)}
                          onLoad={() => console.log('Imagem carregada com sucesso:', file.file_name)}
                        />
                      ) : (
                        <a 
                          href={`${import.meta.env.VITE_API_URL}${file.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-violet-600 hover:text-violet-700 p-2 bg-gray-50 rounded-md"
                        >
                          <File size={16} />
                          <span className="truncate">{file.file_name}</span>
                        </a>
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