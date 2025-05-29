import { NotFoundError, ConflictError, ForbiddenError } from '../../utils/errors';
import { BaseService } from '../shared/BaseService';

export class RoomMembershipService extends BaseService {

  async addMemberToRoom(roomId: string, userIdToAdd: string, adminUserId: string) {
    try {
      this.validateId(roomId, 'ID da sala');
      this.validateId(userIdToAdd, 'ID do usuário a adicionar');
      this.validateId(adminUserId, 'ID do admin');

      const room = await this.db.room.findUnique({
        where: { id: roomId },
        include: {
          members: {
            where: { user_id: adminUserId },
          },
        },
      });

      if (!room) {
        throw new NotFoundError('Sala não encontrada');
      }

      const adminMembership = room.members.find((member: { user_id: string; role: string }) => member.user_id === adminUserId);
      if (!adminMembership || adminMembership.role !== 'ADMIN') {
        throw new ForbiddenError('Apenas admins da sala podem adicionar membros');
      }

      const existingMember = await this.db.room_member.findUnique({
        where: {
          user_id_room_id: {
            user_id: userIdToAdd,
            room_id: roomId,
          },
        },
      });

      if (existingMember) {
        throw new ConflictError('Usuário já é membro desta sala');
      }

      const userToAdd = await this.db.user.findUnique({
        where: { id: userIdToAdd },
        select: { id: true, username: true },
      });

      if (!userToAdd) {
        throw new NotFoundError('Usuário não encontrado');
      }

      const newMember = await this.db.room_member.create({
        data: {
          user_id: userIdToAdd,
          room_id: roomId,
          role: 'MEMBER',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          room: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return newMember;

    } catch (error) {
      this.logError(error, 'RoomMembershipService.addMemberToRoom');
      throw error;
    }
  }

  async removeMemberFromRoom(roomId: string, userIdToRemove: string, adminUserId: string) {
    try {
      this.validateId(roomId, 'ID da sala');
      this.validateId(userIdToRemove, 'ID do usuário a remover');
      this.validateId(adminUserId, 'ID do admin');

      const room = await this.db.room.findUnique({
        where: { id: roomId },
        include: {
          members: true,
        },
      });

      if (!room) {
        throw new NotFoundError('Sala não encontrada');
      }

      const adminMembership = room.members.find((member: { user_id: string; role: string }) => member.user_id === adminUserId);
      if (!adminMembership || adminMembership.role !== 'ADMIN') {
        throw new ForbiddenError('Apenas admins da sala podem remover membros');
      }

      if (userIdToRemove === room.creator_id) {
        throw new ForbiddenError('Não é possível remover o criador da sala');
      }

      const memberToRemove = room.members.find((member: { user_id: string; role: string }) => member.user_id === userIdToRemove);
      if (!memberToRemove) {
        throw new NotFoundError('Usuário não é membro desta sala');
      }

      await this.db.room_member.delete({
        where: {
          user_id_room_id: {
            user_id: userIdToRemove,
            room_id: roomId,
          },
        },
      });

      return { success: true };

    } catch (error) {
      this.logError(error, 'RoomMembershipService.removeMemberFromRoom');
      throw error;
    }
  }

  async getAvailableUsers(roomId: string, adminUserId: string) {
    try {
      this.validateId(roomId, 'ID da sala');
      this.validateId(adminUserId, 'ID do admin');

      const room = await this.db.room.findUnique({
        where: { id: roomId },
        include: {
          members: {
            where: { user_id: adminUserId },
          },
        },
      });

      if (!room) {
        throw new NotFoundError('Sala não encontrada');
      }

      const adminMembership = room.members.find((member: { user_id: string; role: string }) => member.user_id === adminUserId);
      
      if (!adminMembership || adminMembership.role !== 'ADMIN') {
        throw new ForbiddenError('Apenas admins da sala podem visualizar usuários disponíveis');
      }

      const availableUsers = await this.db.user.findMany({
        where: {
          NOT: {
            room_memberships: {
              some: {
                room_id: roomId,
              },
            },
          },
        },
        select: {
          id: true,
          username: true,
        },
      });

      return availableUsers;

    } catch (error) {
      this.logError(error, 'RoomMembershipService.getAvailableUsers');
      throw error;
    }
  }

  async getRoomMembers(roomId: string, userId: string) {
    try {
      this.validateId(roomId, 'ID da sala');
      this.validateId(userId, 'ID do usuário');

      const userMembership = await this.db.room_member.findUnique({
        where: {
          user_id_room_id: {
            user_id: userId,
            room_id: roomId,
          },
        },
      });

      if (!userMembership) {
        throw new ForbiddenError('Você não é membro desta sala');
      }

      const members = await this.db.room_member.findMany({
        where: { room_id: roomId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          joined_at: 'asc',
        },
      });

      return members;

    } catch (error) {
      this.logError(error, 'RoomMembershipService.getRoomMembers');
      throw error;
    }
  }

  async isRoomMember(roomId: string, userId: string): Promise<boolean> {
    try {
      this.validateId(roomId, 'ID da sala');
      this.validateId(userId, 'ID do usuário');

      const membership = await this.db.room_member.findUnique({
        where: {
          user_id_room_id: {
            user_id: userId,
            room_id: roomId,
          },
        },
      });

      return !!membership;

    } catch (error) {
      this.logError(error, 'RoomMembershipService.isRoomMember');
      return false;
    }
  }
} 