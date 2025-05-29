import { BaseService } from '../shared/BaseService';
import { UnreadCount } from '../../models/messageModel';

export class MessageUnreadService extends BaseService {

  async markMessagesAsRead(userId: string, roomId: string) {
    try {
      this.validateId(userId, 'ID do usuário');
      this.validateId(roomId, 'ID da sala');

      await this.db.unread_message.deleteMany({
        where: {
          user_id: userId,
          room_id: roomId,
        },
      });

      return { success: true };

    } catch (error) {
      this.logError(error, 'MessageUnreadService.markMessagesAsRead');
      throw error;
    }
  }

  async createUnreadMessages(messageId: string, roomId: string, excludeUserId: string, activeViewers: Set<string>) {
    try {
      this.validateId(messageId, 'ID da mensagem');
      this.validateId(roomId, 'ID da sala');
      this.validateId(excludeUserId, 'ID do usuário autor');

      const roomMembers = await this.db.room_member.findMany({
        where: {
          room_id: roomId,
          user_id: {
            not: excludeUserId,
          },
        },
        include: {
          user: true,
        },
      });

      const unreadMessages = [];
      const unreadCounts = [];

      for (const member of roomMembers) {
        if (activeViewers.has(member.user.id)) {
          continue;
        }

        const unreadMessage = await this.db.unread_message.create({
          data: {
            message_id: messageId,
            user_id: member.user.id,
            room_id: roomId,
          },
        });

        unreadMessages.push(unreadMessage);

        const unreadCount = await this.db.unread_message.count({
          where: {
            user_id: member.user.id,
            room_id: roomId,
          },
        });

        unreadCounts.push({
          userId: member.user.id,
          count: unreadCount,
        });
      }

      return {
        unreadMessages,
        unreadCounts,
        roomMembers,
      };

    } catch (error) {
      this.logError(error, 'MessageUnreadService.createUnreadMessages');
      throw error;
    }
  }

  async getUnreadCounts(userId: string): Promise<UnreadCount[]> {
    try {
      this.validateId(userId, 'ID do usuário');

      const unreadCounts = await this.db.unread_message.groupBy({
        by: ["room_id"],
        where: {
          user_id: userId,
        },
        _count: {
          _all: true,
        },
      });

      return unreadCounts.map((count: { room_id: string; _count: { _all: number } }) => ({
        roomId: count.room_id,
        count: count._count._all,
      }));

    } catch (error) {
      this.logError(error, 'MessageUnreadService.getUnreadCounts');
      throw error;
    }
  }

  async getUnreadCount(userId: string, roomId: string) {
    try {
      this.validateId(userId, 'ID do usuário');
      this.validateId(roomId, 'ID da sala');

      return await this.db.unread_message.count({
        where: {
          user_id: userId,
          room_id: roomId,
        },
      });

    } catch (error) {
      this.logError(error, 'MessageUnreadService.getUnreadCount');
      throw error;
    }
  }

  async clearAllUnreadMessages(userId: string) {
    try {
      this.validateId(userId, 'ID do usuário');

      await this.db.unread_message.deleteMany({
        where: {
          user_id: userId,
        },
      });

      return { success: true };

    } catch (error) {
      this.logError(error, 'MessageUnreadService.clearAllUnreadMessages');
      throw error;
    }
  }

  async hasUnreadMessages(userId: string, roomId: string): Promise<boolean> {
    try {
      this.validateId(userId, 'ID do usuário');
      this.validateId(roomId, 'ID da sala');

      const count = await this.getUnreadCount(userId, roomId);
      return count > 0;

    } catch (error) {
      this.logError(error, 'MessageUnreadService.hasUnreadMessages');
      return false;
    }
  }
} 