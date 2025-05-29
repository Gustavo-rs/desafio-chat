import React from "react";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Edit2, Trash2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import type { APIRoom } from "@/types/api";

const CompactMarkdown = ({ content, maxLength = 30 }: { content: string; maxLength?: number }) => {
  const truncatedContent = content.length > maxLength ? `${content.slice(0, maxLength)}...` : content;
  
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <span>{children}</span>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => <code className="bg-gray-200 px-1 rounded text-xs">{children}</code>,
        h1: ({ children }) => <span className="font-bold">{children}</span>,
        h2: ({ children }) => <span className="font-bold">{children}</span>,
        h3: ({ children }) => <span className="font-bold">{children}</span>,
        h4: ({ children }) => <span className="font-bold">{children}</span>,
        h5: ({ children }) => <span className="font-bold">{children}</span>,
        h6: ({ children }) => <span className="font-bold">{children}</span>,
        blockquote: ({ children }) => <span className="italic">{children}</span>,
        ul: ({ children }) => <span>{children}</span>,
        ol: ({ children }) => <span>{children}</span>,
        li: ({ children }) => <span>{children} </span>,
        a: ({ children }) => <span className="text-violet-600 underline">{children}</span>,
        br: () => <span> </span>,
      }}
    >
      {truncatedContent}
    </ReactMarkdown>
  );
};

interface RoomItemProps {
  room: APIRoom;
  isSelected: boolean;
  unreadCount: number;
  onSelect: () => void;
  formatUnreadCount: (count: number) => string;
}

export const RoomItem: React.FC<RoomItemProps> = ({
  room,
  isSelected,
  unreadCount,
  onSelect,
  formatUnreadCount,
}) => {
  const renderLastMessage = () => {
    if (!room.lastMessage) {
      return (
        <p className="text-xs text-gray-500 truncate">
          <span className="hidden sm:inline">Nenhuma mensagem ainda</span>
          <span className="sm:hidden">Vazia</span>
        </p>
      );
    }

    const { lastMessage } = room;

    return (
      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
        <strong className="max-w-[60px] truncate">{lastMessage.user.username}</strong>
        <span>:</span>{" "}
        {lastMessage.status === 'DELETED' ? (
          <>
            <Trash2 size={12} className="text-red-400" />
            <span className="italic hidden sm:inline">Esta mensagem foi excluída</span>
            <span className="italic sm:hidden">Excluída</span>
          </>
        ) : lastMessage.status === 'EDITED' ? (
          <>
            <Edit2 size={12} className="text-blue-500" />
            <span className="italic">
              {lastMessage.files && lastMessage.files.length > 0 ? (
                <span>
                  <span className="hidden sm:inline">
                    {lastMessage.files.length > 1 
                      ? `${lastMessage.files.length} arquivos (editada)`
                      : 'Arquivo (editada)'
                    }
                  </span>
                  <span className="sm:hidden">
                    {lastMessage.files.length > 1 
                      ? `${lastMessage.files.length} arq. (ed.)`
                      : 'Arq. (ed.)'
                    }
                  </span>
                </span>
              ) : (
                <span>
                  <span className="hidden sm:inline">
                    <CompactMarkdown content={lastMessage.content} maxLength={25} /> (editada)
                  </span>
                  <span className="sm:hidden">
                    <CompactMarkdown content={lastMessage.content} maxLength={15} /> (ed.)
                  </span>
                </span>
              )}
            </span>
          </>
        ) : lastMessage.files && lastMessage.files.length > 0 ? (
          <>
            <Paperclip size={12} />
            <span className="hidden sm:inline">
              {lastMessage.files.length > 1 
                ? `${lastMessage.files.length} arquivos`
                : 'Arquivo'
              }
            </span>
            <span className="sm:hidden">
              {lastMessage.files.length > 1 
                ? `${lastMessage.files.length} arq.`
                : 'Arq.'
              }
            </span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">
              <CompactMarkdown content={lastMessage.content} maxLength={30} />
            </span>
            <span className="sm:hidden">
              <CompactMarkdown content={lastMessage.content} maxLength={20} />
            </span>
          </>
        )}
      </p>
    );
  };

  return (
    <div
      className={`flex items-center gap-2 md:gap-4 p-2 md:p-3 bg-violet-50 hover:bg-violet-100 transition rounded-lg cursor-pointer shadow-sm ${isSelected ? 'border-2 border-primary' : ''}`}
      onClick={onSelect}
    >
      <div className="flex-shrink-0">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-violet-400 text-white flex items-center justify-center rounded-full text-xs md:text-sm font-bold uppercase">
          {room.name.charAt(0)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-xs md:text-sm lg:text-base truncate">
          {room.name}
          {room.newRoom && (
            <span className="ml-1 md:ml-2 text-xs bg-green-100 text-green-800 px-1 md:px-2 py-0.5 rounded-md">
              <span className="hidden sm:inline">(Novo)</span>
              <span className="sm:hidden">N</span>
            </span>
          )}
        </p>
        {renderLastMessage()}
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {room.lastMessage && (
          <span className="text-xs text-gray-400">
            {new Date(room.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {unreadCount > 0 && !isSelected && (
          <Badge variant="default" className="text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
            {formatUnreadCount(unreadCount)}
          </Badge>
        )}
      </div>
    </div>
  );
}; 