import { BaseService } from '../shared/BaseService';
import { MessageRepositoryService } from './MessageRepositoryService';
import { MessageUnreadService } from './MessageUnreadService';
import { MessageFileService } from './MessageFileService';
import { MessageResponse } from '../../models/messageModel';
import { io, getActiveViewers } from '../../server';

interface FileInfo {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export class MessageService extends BaseService {
  private messageRepository: MessageRepositoryService;
  private messageUnread: MessageUnreadService;
  private messageFile: MessageFileService;

  constructor() {
    super();
    this.messageRepository = new MessageRepositoryService();
    this.messageUnread = new MessageUnreadService();
    this.messageFile = new MessageFileService();
  }

  async createMessage(content: string, userId: string, roomId: string, files?: FileInfo[]) {
    if (files && files.length > 0) {
      for (const file of files) {
        this.messageFile.validateFile(file.fileName, file.fileSize, file.fileType);
      }
    }

    const message = await this.messageRepository.createMessage(content, userId, roomId, files);

    const activeViewers = getActiveViewers(roomId);
    const unreadResult = await this.messageUnread.createUnreadMessages(
      message.id,
      roomId,
      userId,
      activeViewers
    );

    io.emit('receive_message', { roomId, message });

    for (const unreadCount of unreadResult.unreadCounts) {
      io.to(String(unreadCount.userId)).emit('unread_message', {
        roomId,
        lastMessage: message,
        count: unreadCount.count,
      });
    }

    return message;
  }

  async getMessages(roomId: string, userId: string, page: number, limit: number): Promise<MessageResponse> {
    const result = await this.messageRepository.getMessages(roomId, userId, page, limit);
    
    await this.markMessagesAsRead(userId, roomId);
    
    return result;
  }

  async updateMessage(messageId: string, content: string, userId: string) {
    const updatedMessage = await this.messageRepository.updateMessage(messageId, content, userId);

    const message = await this.messageRepository.getMessageById(messageId);
    io.to(message.room_id).emit('message_updated', { 
      messageId, 
      content,
      message: updatedMessage
    });

    return updatedMessage;
  }

  async deleteMessage(messageId: string, userId: string) {
    const { message, updatedMessage } = await this.messageRepository.deleteMessage(messageId, userId);

    if (message.files && message.files.length > 0) {
      await this.messageFile.deleteMessageFiles(messageId);
    }

    io.to(message.room_id).emit('message_deleted', { 
      messageId, 
      message: updatedMessage 
    });

    return updatedMessage;
  }

  async getMessageById(messageId: string) {
    return this.messageRepository.getMessageById(messageId);
  }

  async getTotalMessages(roomId: string) {
    return this.messageRepository.getTotalMessages(roomId);
  }

  async markMessagesAsRead(userId: string, roomId: string) {
    await this.messageUnread.markMessagesAsRead(userId, roomId);

    io.to(String(userId)).emit('messages_read', { roomId });

    return { success: true };
  }

  async getUnreadCounts(userId: string) {
    return this.messageUnread.getUnreadCounts(userId);
  }

  async getUnreadCount(userId: string, roomId: string) {
    return this.messageUnread.getUnreadCount(userId, roomId);
  }

  async clearAllUnreadMessages(userId: string) {
    return this.messageUnread.clearAllUnreadMessages(userId);
  }

  async hasUnreadMessages(userId: string, roomId: string): Promise<boolean> {
    return this.messageUnread.hasUnreadMessages(userId, roomId);
  }

  async getMessageFiles(messageId: string) {
    return this.messageFile.getMessageFiles(messageId);
  }

  async getRoomFiles(roomId: string, userId: string) {
    return this.messageFile.getRoomFiles(roomId, userId);
  }

  async getFileById(fileId: string) {
    return this.messageFile.getFileById(fileId);
  }

  async getTotalRoomFiles(roomId: string) {
    return this.messageFile.getTotalRoomFiles(roomId);
  }

  validateFile(fileName: string, fileSize: number, fileType: string) {
    return this.messageFile.validateFile(fileName, fileSize, fileType);
  }

  async deleteMessageFiles(messageId: string) {
    return this.messageFile.deleteMessageFiles(messageId);
  }
}