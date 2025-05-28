import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { BaseService } from '../shared/BaseService';
import { MessageResponse } from '../../models/messageModel';

interface FileInfo {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export class MessageRepositoryService extends BaseService {

  async createMessage(content: string, userId: string, roomId: string, files?: FileInfo[]) {
    try {
      this.validateId(userId, 'ID do usuário');
      this.validateId(roomId, 'ID da sala');
      
      if ((!content || content.trim().length === 0) && (!files || files.length === 0)) {
        throw new Error('Mensagem deve conter texto ou pelo menos um arquivo');
      }

      const roomMembership = await this.db.room_member.findUnique({
        where: {
          user_id_room_id: {
            user_id: userId,
            room_id: roomId,
          },
        },
        include: {
          room: true,
        },
      });

      if (!roomMembership) {
        throw new ForbiddenError('Você não é membro desta sala');
      }

      const message = await this.db.message.create({
        data: {
          content: content?.trim() || '',
          room_id: roomId,
          user_id: userId,
          files: files ? {
            create: files.map(file => ({
              file_name: file.fileName,
              file_url: file.fileUrl,
              file_type: file.fileType,
              file_size: file.fileSize,
            }))
          } : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          files: true,
        },
      });

      return message;

    } catch (error) {
      this.logError(error, 'MessageRepositoryService.createMessage');
      throw error;
    }
  }

  async getMessages(roomId: string, userId: string, page: number, limit: number): Promise<MessageResponse> {
    try {
      this.validateId(roomId, 'ID da sala');
      this.validateId(userId, 'ID do usuário');

      if (page < 1) page = 1;
      if (limit < 1 || limit > 100) limit = 20;

      const roomMembership = await this.db.room_member.findUnique({
        where: {
          user_id_room_id: {
            user_id: userId,
            room_id: roomId,
          },
        },
      });

      if (!roomMembership) {
        throw new ForbiddenError('Você não é membro desta sala');
      }

      const skip = (page - 1) * limit;
      const [messages, total] = await Promise.all([
        this.db.message.findMany({
          where: { 
            room_id: roomId
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
            files: true,
          },
          orderBy: { created_at: "desc" },
          skip,
          take: limit,
        }),
        this.db.message.count({ 
          where: { 
            room_id: roomId
          }
        }),
      ]);

      const orderedMessages = messages.reverse();
      const pages = Math.ceil(total / limit);

      return {
        total,
        pages,
        currentPage: page,
        limit,
        messages: orderedMessages.map((msg: any) => ({
          ...msg,
          roomId: msg.room_id,
          userId: msg.user_id,
          createdAt: msg.created_at,
          updatedAt: msg.updated_at,
        })) as any,
      };

    } catch (error) {
      this.logError(error, 'MessageRepositoryService.getMessages');
      throw error;
    }
  }

  async updateMessage(messageId: string, content: string, userId: string) {
    try {
      this.validateId(messageId, 'ID da mensagem');
      this.validateId(userId, 'ID do usuário');
      
      if (!content || content.trim().length === 0) {
        throw new Error('Conteúdo da mensagem é obrigatório');
      }

      const message = await this.db.message.findUnique({
        where: { id: messageId },
        select: { room_id: true, user_id: true, status: true }
      });

      if (!message) {
        throw new NotFoundError('Mensagem não encontrada');
      }

      if (message.user_id !== userId) {
        throw new ForbiddenError('Você só pode editar suas próprias mensagens');
      }

      if (message.status === 'DELETED') {
        throw new Error('Não é possível editar mensagem deletada');
      }

      const updatedMessage = await this.db.message.update({
        where: { id: messageId },
        data: { 
          content: content.trim(),
          status: 'EDITED'
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          files: true,
        },
      });

      return updatedMessage;

    } catch (error) {
      this.logError(error, 'MessageRepositoryService.updateMessage');
      throw error;
    }
  }

  async deleteMessage(messageId: string, userId: string) {
    try {
      this.validateId(messageId, 'ID da mensagem');
      this.validateId(userId, 'ID do usuário');

      const message = await this.db.message.findUnique({
        where: { id: messageId },
        include: {
          files: true,
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      if (!message) {
        throw new NotFoundError('Mensagem não encontrada');
      }

      if (message.user_id !== userId) {
        throw new ForbiddenError('Você só pode deletar suas próprias mensagens');
      }

      if (message.status === 'DELETED') {
        throw new Error('Mensagem já foi deletada');
      }

      const updatedMessage = await this.db.message.update({
        where: { id: messageId },
        data: { 
          status: 'DELETED',
          content: 'Mensagem deletada'
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          files: true,
        },
      });

      return { message, updatedMessage };

    } catch (error) {
      this.logError(error, 'MessageRepositoryService.deleteMessage');
      throw error;
    }
  }

  async getTotalMessages(roomId: string) {
    try {
      this.validateId(roomId, 'ID da sala');

      return await this.db.message.count({
        where: { room_id: roomId },
      });

    } catch (error) {
      this.logError(error, 'MessageRepositoryService.getTotalMessages');
      throw error;
    }
  }

  async getMessageById(messageId: string) {
    try {
      this.validateId(messageId, 'ID da mensagem');

      const message = await this.db.message.findUnique({
        where: { id: messageId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          files: true,
        },
      });

      if (!message) {
        throw new NotFoundError('Mensagem não encontrada');
      }

      return message;

    } catch (error) {
      this.logError(error, 'MessageRepositoryService.getMessageById');
      throw error;
    }
  }
} 