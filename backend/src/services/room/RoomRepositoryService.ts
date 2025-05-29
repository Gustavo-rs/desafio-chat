import { NotFoundError, ConflictError, ForbiddenError } from '../../utils/errors';
import { BaseService } from '../shared/BaseService';

export class RoomRepositoryService extends BaseService {

  async createRoom(name: string, creatorId: string) {
    try {
      this.validateId(creatorId, 'ID do criador');
      
      if (!name || name.trim().length === 0) {
        throw new Error('Nome da sala é obrigatório');
      }

      const existingRoom = await this.db.room.findFirst({
        where: { name },
      });

      if (existingRoom) {
        throw new ConflictError('Nome da sala já existe');
      }

      const room = await this.db.room.create({
        data: { 
          name: name.trim(),
          creator_id: creatorId,
          members: {
            create: {
              user_id: creatorId,
              role: 'ADMIN'
            }
          }
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      return room;

    } catch (error) {
      this.logError(error, 'RoomRepositoryService.createRoom');
      throw error;
    }
  }

  async deleteRoom(id: string, userId: string) {
    try {
      this.validateId(id, 'ID da sala');
      this.validateId(userId, 'ID do usuário');

      const room = await this.db.room.findUnique({
        where: { id },
        include: {
          members: {
            where: { user_id: userId },
          },
        },
      });

      if (!room) {
        throw new NotFoundError('Sala não encontrada');
      }

      if (room.creator_id !== userId) {
        throw new ForbiddenError('Apenas o criador da sala pode deletá-la');
      }

      await this.db.room.delete({
        where: { id },
      });

      return { success: true };

    } catch (error) {
      this.logError(error, 'RoomRepositoryService.deleteRoom');
      throw error;
    }
  }

  async getRoomById(id: string, userId: string) {
    try {
      this.validateId(id, 'ID da sala');
      this.validateId(userId, 'ID do usuário');

      const room = await this.db.room.findUnique({
        where: { id },
        include: {
          messages: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
            orderBy: {
              created_at: 'asc',
            },
          },
          members: {
            where: { user_id: userId },
          },
        },
      });

      if (!room) {
        throw new NotFoundError('Sala não encontrada');
      }

      if (room.members.length === 0) {
        throw new ForbiddenError('Você não é membro desta sala');
      }

      return room;

    } catch (error) {
      this.logError(error, 'RoomRepositoryService.getRoomById');
      throw error;
    }
  }

  async getRooms(userId: string) {
    try {
      this.validateId(userId, 'ID do usuário');

      const rooms = await this.db.room.findMany({
        where: {
          members: {
            some: {
              user_id: userId,
            },
          },
        },
        include: {
          messages: {
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
              files: true,
            },
          },
          unread_messages: {
            where: {
              user_id: userId,
            },
            select: {
              id: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      const roomsWithActivity = rooms.map((room: any) => {
        const lastMessage = room.messages[0] || null;
        const lastActivity = lastMessage ? lastMessage.created_at : room.created_at;
        
        return {
          ...room,
          lastMessage,
          unreadCount: room.unread_messages.length,
          lastActivity,
          messages: undefined,
          unread_messages: undefined,
        };
      });
      
      roomsWithActivity.sort((a: any, b: any) => {
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      });

      return roomsWithActivity.map(({ lastActivity, ...room }: { lastActivity: any; [key: string]: any }) => room);

    } catch (error) {
      this.logError(error, 'RoomRepositoryService.getRooms');
      throw error;
    }
  }

  async roomExists(id: string): Promise<boolean> {
    try {
      this.validateId(id, 'ID da sala');

      const room = await this.db.room.findUnique({
        where: { id },
        select: { id: true },
      });

      return !!room;

    } catch (error) {
      this.logError(error, 'RoomRepositoryService.roomExists');
      return false;
    }
  }
} 