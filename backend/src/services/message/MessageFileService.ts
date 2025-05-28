import { BaseService } from '../shared/BaseService';
import { FileUtils } from '../../utils/fileUtils';

export class MessageFileService extends BaseService {

  async deleteMessageFiles(messageId: string) {
    try {
      this.validateId(messageId, 'ID da mensagem');

      const messageFiles = await this.db.message_file.findMany({
        where: {
          message_id: messageId,
        },
      });

      if (messageFiles.length === 0) {
        return { success: true, deletedFiles: [] };
      }

      const fileUrls = messageFiles.map(file => file.file_url);
      
      const deleteResult = await FileUtils.deleteFiles(fileUrls);
      
      await this.db.message_file.deleteMany({
        where: {
          message_id: messageId,
        },
      });

      return {
        success: true,
        deletedFiles: messageFiles,
        deleteResult,
      };

    } catch (error) {
      this.logError(error, 'MessageFileService.deleteMessageFiles');
      throw error;
    }
  }

  async getMessageFiles(messageId: string) {
    try {
      this.validateId(messageId, 'ID da mensagem');

      const files = await this.db.message_file.findMany({
        where: {
          message_id: messageId,
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      return files.map(file => ({
        id: file.id,
        fileName: file.file_name,
        fileUrl: file.file_url,
        fileType: file.file_type,
        fileSize: file.file_size,
        createdAt: file.created_at,
      }));

    } catch (error) {
      this.logError(error, 'MessageFileService.getMessageFiles');
      throw error;
    }
  }

  async getRoomFiles(roomId: string, userId: string) {
    try {
      this.validateId(roomId, 'ID da sala');
      this.validateId(userId, 'ID do usuário');

      const roomMembership = await this.db.room_member.findUnique({
        where: {
          user_id_room_id: {
            user_id: userId,
            room_id: roomId,
          },
        },
      });

      if (!roomMembership) {
        throw new Error('Você não é membro desta sala');
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

      return files;

    } catch (error) {
      this.logError(error, 'MessageFileService.getRoomFiles');
      throw error;
    }
  }

  validateFile(fileName: string, fileSize: number, fileType: string) {
    const maxFileSize = 10 * 1024 * 1024;
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/xml',
      'text/xml',
      'application/json',
      'text/csv',
      'application/rtf',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/avi'
    ];

    if (fileSize > maxFileSize) {
      throw new Error('Arquivo muito grande. Máximo permitido: 10MB');
    }

    if (!allowedTypes.includes(fileType)) {
      throw new Error(`Tipo de arquivo '${fileType}' não permitido. Tipos aceitos: imagens, PDFs, documentos do Office, arquivos compactados, XML, CSV e outros formatos comuns.`);
    }

    if (!fileName || fileName.trim().length === 0) {
      throw new Error('Nome do arquivo é obrigatório');
    }

    return true;
  }

  async getFileById(fileId: string) {
    try {
      this.validateId(fileId, 'ID do arquivo');

      const file = await this.db.message_file.findUnique({
        where: { id: fileId },
        include: {
          message: {
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

      if (!file) {
        throw new Error('Arquivo não encontrado');
      }

      return {
        id: file.id,
        fileName: file.file_name,
        fileUrl: file.file_url,
        fileType: file.file_type,
        fileSize: file.file_size,
        createdAt: file.created_at,
        message: file.message,
      };

    } catch (error) {
      this.logError(error, 'MessageFileService.getFileById');
      throw error;
    }
  }

  async getTotalRoomFiles(roomId: string) {
    try {
      this.validateId(roomId, 'ID da sala');

      const count = await this.db.message_file.count({
        where: {
          message: {
            room_id: roomId,
            status: { not: 'DELETED' },
          },
        },
      });

      return count;

    } catch (error) {
      this.logError(error, 'MessageFileService.getTotalRoomFiles');
      throw error;
    }
  }
} 