import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, UserMinus, Crown, User, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import roomsService from '@/services/rooms-service';
import type { RoomMember, AvailableUser } from '@/types/api';
import { useUser } from '@/store/auth-store';

interface RoomMembersManagerProps {
  roomId: string;
  members: RoomMember[];
  userRole: 'ADMIN' | 'MEMBER';
  onMembersUpdate: () => void;
}

export default function RoomMembersManager({
  roomId,
  members,
  userRole,
  onMembersUpdate,
}: RoomMembersManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [allUsers, setAllUsers] = useState<AvailableUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<{ id: string; username: string } | null>(null);
  const { user } = useUser();

  const fetchAvailableUsers = async () => {
    if (userRole !== 'ADMIN') return;
    
    setIsLoadingUsers(true);
    try {
      const response = await roomsService.getAvailableUsers(roomId);
      console.log('Usuários disponíveis:', response.data);
      
      const allUsersResponse = await roomsService.getAllUsers(roomId);
      const filteredUsers = allUsersResponse.data.filter(u => 
        !members.some(member => member.user.id === u.id)
      );
      setAllUsers(filteredUsers);
      console.log('Todos os usuários (filtrados):', filteredUsers);
      
    } catch (error) {
      console.error('Erro ao buscar usuários disponíveis:', error);
      toast.error('Erro ao carregar usuários disponíveis');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAddDialogOpen) {
      fetchAvailableUsers();
    }
  }, [isAddDialogOpen, roomId, userRole]);

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Selecione um usuário');
      return;
    }

    setIsLoading(true);
    try {
      await roomsService.addMemberToRoom(roomId, selectedUserId);
      toast.success('Usuário adicionado com sucesso!');
      setIsAddDialogOpen(false);
      setSelectedUserId('');
      setSearchTerm('');
      onMembersUpdate();
    } catch (error: any) {
      console.error('Erro ao adicionar membro:', error);
      toast.error(error.response?.data?.message || 'Erro ao adicionar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveMember = (userId: string, username: string) => {
    setUserToRemove({ id: userId, username });
    setIsConfirmDialogOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!userToRemove) return;

    try {
      await roomsService.removeMemberFromRoom(roomId, userToRemove.id);
      toast.success(`${userToRemove.username} foi removido da sala`);
      onMembersUpdate();
    } catch (error: any) {
      console.error('Erro ao remover membro:', error);
      toast.error(error.response?.data?.message || 'Erro ao remover usuário');
    } finally {
      setIsConfirmDialogOpen(false);
      setUserToRemove(null);
    }
  };

  const isCurrentUserAdmin = userRole === 'ADMIN';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Membros ({members.length})</h4>
        {isCurrentUserAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 px-2">
                <UserPlus size={12} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Membro</DialogTitle>
                <DialogDescription>
                  Selecione um usuário para adicionar à sala.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="ml-2 text-sm">Carregando usuários...</span>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        placeholder="Buscar usuário por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {filteredUsers.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-gray-50 min-w-0 ${
                              selectedUserId === user.id ? 'bg-violet-50 border-violet-200' : 'border-gray-200'
                            }`}
                            onClick={() => setSelectedUserId(user.id)}
                          >
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-700 font-semibold text-xs">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium truncate block" title={user.username}>
                                {user.username}
                              </span>
                            </div>
                            
                            {selectedUserId === user.id && (
                              <div className="w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : searchTerm ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhum usuário encontrado com "{searchTerm}"
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 flex items-center justify-center py-4">
                        Todos os usuários já são membros desta sala
                      </p>
                    )}
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddMember}
                  disabled={isLoading || !selectedUserId}
                >
                  <span className='text-white'>{isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Adicionando...
                    </span>
                  ) : (
                    'Adicionar'
                  )}</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg min-w-0"
          >
            <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-violet-700 font-semibold text-xs">
                {member.user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs truncate" title={member.user.username}>
                {member.user.username}
                {member.user.id === user?.user?.id && (
                  <span className="text-gray-500 ml-1">(você)</span>
                )}
              </p>
            </div>
            
            <div className="flex-shrink-0">
              {member.role === 'ADMIN' ? (
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  <Crown size={10} className="mr-1" />
                  Admin
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  <User size={10} className="mr-1" />
                  Membro
                </Badge>
              )}
            </div>
            
            {isCurrentUserAdmin && 
             member.role !== 'ADMIN' && 
             member.user.id !== user?.user?.id && (
              <div className="flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveMember(member.user.id, member.user.username)}
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  title={`Remover ${member.user.username}`}
                >
                  <UserMinus size={12} />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remover Membro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{userToRemove?.username}</strong> da sala?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                Esta ação não pode ser desfeita. O usuário perderá acesso à sala e suas mensagens.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmDialogOpen(false);
                setUserToRemove(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={confirmRemoveMember}
            >
              <span className='text-white'>{isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Removendo...
                </span>
              ) : ( 
                'Remover'
              )}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 