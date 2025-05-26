import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Info, 
  Loader2, 
  MessageSquare, 
  Users, 
  File, 
  Image, 
  Download 
} from "lucide-react";
import roomsService from "@/services/rooms-service";
import RoomMembersManager from "@/components/RoomMembersManager";
import type { RoomDetails } from "@/types/api";

interface RoomDetailsPageProps {
  roomId: string;
  roomName?: string;
}

export default function RoomDetailsPage({ roomId, roomName }: RoomDetailsPageProps) {
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchRoomDetails = async (id: string) => {
    if (!id) return;
    
    setLoadingDetails(true);
    try {
      const response = await roomsService.getRoomDetails(id);
      setRoomDetails(response.data);
    } catch (error) {
      console.error("Erro ao buscar detalhes da sala:", error);
      setRoomDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails(roomId);
    }
  }, [roomId]);

  if (!roomId) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm p-3 md:p-4 flex flex-col">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
          <Info size={20} />
          Detalhes da Sala
        </h2>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Info size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs md:text-sm">Selecione uma sala para ver os detalhes</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingDetails) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm p-3 md:p-4 flex flex-col">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
          <Info size={20} />
          Detalhes da Sala
        </h2>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={24} className="animate-spin text-violet-500 mx-auto mb-2" />
            <p className="text-xs md:text-sm text-gray-500">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!roomDetails) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm p-3 md:p-4 flex flex-col">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
          <Info size={20} />
          Detalhes da Sala
        </h2>
        
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs md:text-sm text-gray-500">Erro ao carregar detalhes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg shadow-sm p-3 md:p-4 flex flex-col">
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
        <Info size={20} />
        Detalhes da Sala
      </h2>
      
      <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 min-h-0">
        {/* Informações básicas */}
        <div className="bg-gray-50 rounded-lg p-3 md:p-4">
          <h3 className="font-semibold text-gray-800 mb-2 md:mb-3 text-sm md:text-base">Informações</h3>
          <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
            <div>
              <span className="text-gray-500 block mb-1">Nome:</span>
              <p className="font-medium">{roomDetails.name}</p>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Criada em:</span>
              <p className="font-medium">
                {new Date(roomDetails.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Criador:</span>
              <p className="font-medium">{roomDetails.creator.username}</p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div className="bg-violet-50 rounded-lg p-3 md:p-4 text-center">
            <MessageSquare className="mx-auto mb-1 md:mb-2 text-violet-600" size={24} />
            <p className="text-lg md:text-2xl font-bold text-violet-700">{roomDetails.totalMessages}</p>
            <p className="text-xs md:text-sm text-violet-600">Mensagens</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 md:p-4 text-center">
            <Users className="mx-auto mb-1 md:mb-2 text-blue-600" size={24} />
            <p className="text-lg md:text-2xl font-bold text-blue-700">{roomDetails.totalUsers}</p>
            <p className="text-xs md:text-sm text-blue-600">Participantes</p>
          </div>
        </div>

        {/* Gerenciador de Membros */}
        <div className="bg-gray-50 rounded-lg p-4">
          <RoomMembersManager
            roomId={roomId}
            members={roomDetails.members || []}
            userRole={roomDetails.userRole}
            onMembersUpdate={() => fetchRoomDetails(roomId)}
          />
        </div>

        {/* Arquivos compartilhados */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-base flex items-center gap-2">
            <File size={18} />
            Arquivos Compartilhados ({roomDetails.sharedFiles?.length || 0})
          </h3>
          {roomDetails.sharedFiles && roomDetails.sharedFiles.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {roomDetails.sharedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  {file.fileType.startsWith('image/') ? (
                    <Image size={20} className="text-green-600 flex-shrink-0" />
                  ) : (
                    <File size={20} className="text-blue-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.fileName}</p>
                    <p className="text-xs text-gray-500">
                      Enviado por {file.uploadedBy} em {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const downloadUrl = `${import.meta.env.VITE_API_URL}${file.fileUrl}`;
                      const link = document.createElement('a');
                      link.href = downloadUrl;
                      link.download = file.fileName;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center gap-1"
                    title={`Baixar ${file.fileName}`}
                  >
                    <Download size={14} />
                    Baixar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <File size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500 italic">
                Nenhum arquivo compartilhado nesta sala
              </p>
            </div>
          )}
        </div>

        {/* Participantes mais ativos */}
        {roomDetails.participants && roomDetails.participants.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 text-base flex items-center gap-2">
              <Users size={18} />
              Participantes Mais Ativos
            </h3>
            <div className="space-y-2">
              {roomDetails.participants.slice(0, 5).map((participant) => (
                <div key={participant.userId} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="font-medium text-sm">{participant.username}</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-violet-600">
                      {participant.messageCount} mensagens
                    </p>
                    <p className="text-xs text-gray-500">
                      Última atividade: {new Date(participant.lastActiveAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 