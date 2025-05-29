import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { BaseService } from '../shared/BaseService';

export class RoomDetailsService extends BaseService {

  async getRoomDetails(roomId: string, userId: string) {
    try {
      this.validateId(roomId, 'ID da sala');
      this.validateId(userId, 'ID do usuário');

      const room = await this.db.room.findUnique({
        where: { id: roomId },
        include: {
          messages: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
              files: true,
            },
            orderBy: {
              created_at: 'asc',
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
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      if (!room) {
        throw new NotFoundError('Sala não encontrada');
      }

      const userMembership = room.members.find((member: { user_id: string; role: string }) => member.user_id === userId);
      if (!userMembership) {
        throw new ForbiddenError('Você não é membro desta sala');
      }

      const totalMessages = room.messages.length;
      const activeMessages = room.messages.filter((msg: { status: string }) => msg.status === 'ACTIVE').length;
      const editedMessages = room.messages.filter((msg: { status: string }) => msg.status === 'EDITED').length;
      const deletedMessages = room.messages.filter((msg: { status: string }) => msg.status === 'DELETED').length;

      const participantMap = new Map();
      room.messages.forEach((msg: { user: { id: string; username: string }; created_at: Date }) => {
        const userId = msg.user.id;
        if (participantMap.has(userId)) {
          participantMap.get(userId).messageCount++;
          participantMap.get(userId).lastActiveAt = msg.created_at;
        } else {
          participantMap.set(userId, {
            userId: msg.user.id,
            username: msg.user.username,
            messageCount: 1,
            lastActiveAt: msg.created_at,
          });
        }
      });

      const participants = Array.from(participantMap.values());

      const sharedFiles = room.messages
        .filter((msg: { files: any[]; status: string }) => msg.files && msg.files.length > 0 && msg.status !== 'DELETED')
        .flatMap((msg: { files: any[]; user: { username: string }; created_at: Date }) => 
          msg.files.map((file: { id: string; file_name?: string; file_type?: string; file_url: string; file_size?: number }) => ({
            id: file.id,
            fileName: file.file_name || 'Arquivo',
            fileType: file.file_type || 'application/octet-stream',
            fileUrl: file.file_url,
            fileSize: file.file_size || 0,
            uploadedBy: msg.user.username,
            uploadedAt: msg.created_at,
          }))
        );

      const firstMessage = room.messages.length > 0 ? room.messages[0] : null;
      const lastMessage = room.messages.length > 0 ? room.messages[room.messages.length - 1] : null;

      return {
        id: room.id,
        name: room.name,
        created_at: room.created_at,
        creator: room.creator,
        totalMessages,
        activeMessages,
        editedMessages,
        deletedMessages,
        totalUsers: room.members.length,
        lastMessageAt: lastMessage?.created_at || null,
        firstMessageAt: firstMessage?.created_at || null,
        participants,
        sharedFiles,
        members: room.members,
        userRole: userMembership.role,
      };

    } catch (error) {
      this.logError(error, 'RoomDetailsService.getRoomDetails');
      throw error;
    }
  }

  async getRoomParticipants(roomId: string, userId: string) {
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

      const messages = await this.db.message.findMany({
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
          created_at: 'desc',
        },
      });

      const participantMap = new Map();
      messages.forEach((msg) => {
        const userId = msg.user.id;
        if (participantMap.has(userId)) {
          participantMap.get(userId).messageCount++;
          if (msg.created_at > participantMap.get(userId).lastActiveAt) {
            participantMap.get(userId).lastActiveAt = msg.created_at;
          }
        } else {
          participantMap.set(userId, {
            userId: msg.user.id,
            username: msg.user.username,
            messageCount: 1,
            lastActiveAt: msg.created_at,
          });
        }
      });

      return { participants: Array.from(participantMap.values()) };

    } catch (error) {
      this.logError(error, 'RoomDetailsService.getRoomParticipants');
      throw error;
    }
  }

  async getRoomFiles(roomId: string, userId: string) {
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

      const messagesWithFiles = await this.db.message.findMany({
        where: {
          room_id: roomId,
          status: { not: 'DELETED' },
          files: {
            some: {},
          },
        },
        include: {
          files: true,
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      const files = messagesWithFiles.flatMap((msg) =>
        msg.files.map((file) => ({
          id: file.id,
          fileName: file.file_name || 'Arquivo',
          fileType: file.file_type || 'application/octet-stream',
          fileUrl: file.file_url,
          fileSize: file.file_size || 0,
          uploadedBy: msg.user.username,
          uploadedAt: msg.created_at,
          messageId: msg.id,
        }))
      );

      return { files };

    } catch (error) {
      this.logError(error, 'RoomDetailsService.getRoomFiles');
      throw error;
    }
  }
} 