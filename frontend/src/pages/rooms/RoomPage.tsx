import React from "react";
import type { APIRoom } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Paperclip, 
  Edit2, 
  Trash2,
  Plus
} from "lucide-react";
import ReactMarkdown from 'react-markdown';

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

interface RoomPageProps {
  rooms: APIRoom[];
  selectedRoomId?: string;
  unreadCounts: Record<string, number>;
  open: boolean;
  setOpen: (open: boolean) => void;
  roomName: string;
  setRoomName: (name: string) => void;
  isCreatingRoom: boolean;
  handleCreateRoom: () => void;
  handleRoomSelect: (room: APIRoom) => void;
  formatUnreadCount: (count: number) => string;
}

export default function RoomPage({
  rooms,
  selectedRoomId,
  unreadCounts,
  open,
  setOpen,
  roomName,
  setRoomName,
  isCreatingRoom,
  handleCreateRoom,
  handleRoomSelect,
  formatUnreadCount
}: RoomPageProps) {
  return (
    <div className="w-full h-full p-3 md:p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800">Salas</h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs md:text-sm text-primary border-primary px-2 md:px-3"
            >
              <span className="hidden sm:inline">Nova sala</span>
              <Plus className="sm:hidden" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[475px]">
            <DialogHeader>
              <DialogTitle>Nova sala</DialogTitle>
              <DialogDescription>
                Crie uma nova sala para começar a conversar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Nome da sala"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                variant="default"
                className="text-white mb-2 sm:mb-0"
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
              >
                {isCreatingRoom ? (
                  <span>
                    <Loader2 className="animate-spin" />
                  </span>
                ) : (
                  <span>Criar Sala</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-3 md:mb-4">
        <input
          type="text"
          placeholder="Pesquisar..."
          className="w-full px-3 md:px-4 py-2 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs md:text-sm"
        />
      </div>

      <div className="space-y-2 md:space-y-3 overflow-y-auto flex-1 pr-1 md:pr-2 min-h-0">
        {rooms.map((room, index) => (
          <div
            key={room.id}
            className={`flex items-center gap-2 md:gap-4 p-2 md:p-3 bg-violet-50 hover:bg-violet-100 transition rounded-lg cursor-pointer shadow-sm ${selectedRoomId === room.id.toString() ? 'border-2 border-primary' : ''}`}
            onClick={() => handleRoomSelect(room)}
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
              {room.lastMessage ? (
                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <strong>{room.lastMessage.user.username}</strong>
                  <span>:</span>{" "}
                  {room.lastMessage.status === 'DELETED' ? (
                    <>
                      <Trash2 size={12} className="text-red-400" />
                      <span className="italic hidden sm:inline">Esta mensagem foi excluída</span>
                      <span className="italic sm:hidden">Excluída</span>
                    </>
                  ) : room.lastMessage.status === 'EDITED' ? (
                    <>
                      <Edit2 size={12} className="text-blue-500" />
                      <span className="italic">
                        {room.lastMessage.files && room.lastMessage.files.length > 0 ? (
                          <span>
                            <span className="hidden sm:inline">
                              {room.lastMessage.files.length > 1 
                                ? `${room.lastMessage.files.length} arquivos (editada)`
                                : 'Arquivo (editada)'
                              }
                            </span>
                            <span className="sm:hidden">
                              {room.lastMessage.files.length > 1 
                                ? `${room.lastMessage.files.length} arq. (ed.)`
                                : 'Arq. (ed.)'
                              }
                            </span>
                          </span>
                        ) : (
                          <span>
                            <span className="hidden sm:inline">
                              <CompactMarkdown content={room.lastMessage.content} maxLength={25} /> (editada)
                            </span>
                            <span className="sm:hidden">
                              <CompactMarkdown content={room.lastMessage.content} maxLength={15} /> (ed.)
                            </span>
                          </span>
                        )}
                      </span>
                    </>
                  ) : room.lastMessage.files && room.lastMessage.files.length > 0 ? (
                    <>
                      <Paperclip size={12} />
                      <span className="hidden sm:inline">
                        {room.lastMessage.files.length > 1 
                          ? `${room.lastMessage.files.length} arquivos`
                          : 'Arquivo'
                        }
                      </span>
                      <span className="sm:hidden">
                        {room.lastMessage.files.length > 1 
                          ? `${room.lastMessage.files.length} arq.`
                          : 'Arq.'
                        }
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="sm:inline">
                        <CompactMarkdown content={room.lastMessage.content} maxLength={30} />
                      </span>
                      <span className="sm:hidden">
                        <CompactMarkdown content={room.lastMessage.content} maxLength={20} />
                      </span>
                    </>
                  )}
                </p>
              ) : (
                <p className="text-xs text-gray-500 truncate">
                  <span className="hidden sm:inline">Nenhuma mensagem ainda</span>
                  <span className="sm:hidden">Vazia</span>
                </p>
              )}
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
              {room.lastMessage && (
                <span className="text-xs text-gray-400">
                  {new Date(room.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {unreadCounts[room.id.toString()] > 0 && (
                <Badge variant="default" className="text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                  {formatUnreadCount(unreadCounts[room.id.toString()])}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}