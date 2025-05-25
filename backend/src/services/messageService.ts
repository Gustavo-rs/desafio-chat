import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import { io, getActiveViewers } from '../server';
import { MessageResponse, UnreadCount } from "../models/message.model";

const prisma = new PrismaClient();

interface FileInfo {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export class MessageService {
  async createMessage(content: string, userId: string, roomId: string, fileInfo?: FileInfo) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const messageData = {
      content,
      roomId,
      userId,
      fileName: fileInfo?.fileName,
      fileUrl: fileInfo?.fileUrl,
      fileType: fileInfo?.fileType,
      fileSize: fileInfo?.fileSize,
    } as const;

    const message = await prisma.message.create({
      data: messageData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Get all users except the sender
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
      },
    });

    // Get users currently viewing this room
    const activeViewers = getActiveViewers(roomId);

    // Create unread entries for all other users who are NOT actively viewing the room
    for (const user of users) {
      // Skip notification if user is actively viewing the room
      if (activeViewers.has(user.id)) {
        console.log(`⏭️ Skipping notification for ${user.username} - actively viewing room ${roomId}`);
        continue;
      }

      await prisma.unreadMessage.create({
        data: {
          messageId: message.id,
          userId: user.id,
          roomId,
        },
      });

      // Get unread count for this user and room
      const unreadCount = await prisma.unreadMessage.count({
        where: {
          userId: user.id,
          roomId,
        },
      });

      io.to(String(user.id)).emit('unread_message', {
        roomId,
        lastMessage: message,
        count: unreadCount,
      });
    }

    io.to(roomId).emit('receive_message', message);
    return message;
  }

  async getMessages(roomId: string, userId: string, page: number, limit: number): Promise<MessageResponse> {
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { 
          roomId
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.message.count({ 
        where: { 
          roomId
        }
      }),
    ]);

    // Inverte a ordem das mensagens para que as mais antigas fiquem no topo
    const orderedMessages = messages.reverse();

    // Mark messages as read when user enters the room
    await this.markMessagesAsRead(userId, roomId);

    const pages = Math.ceil(total / limit);

    return {
      total,
      pages,
      currentPage: page,
      limit,
      messages: orderedMessages,
    };
  }

  async getTotalMessages(roomId: string) {
    return prisma.message.count({
      where: { roomId },
    });
  }

  async getUnreadCounts(userId: string): Promise<UnreadCount[]> {
    const unreadCounts = await prisma.unreadMessage.groupBy({
      by: ["roomId"],
      where: {
        userId,
      },
      _count: {
        _all: true,
      },
    });

    return unreadCounts.map((count) => ({
      roomId: count.roomId,
      count: count._count._all,
    }));
  }

  async getUnreadCount(userId: string, roomId: string) {
    return prisma.unreadMessage.count({
      where: {
        userId,
        roomId,
      },
    });
  }

  async markMessagesAsRead(userId: string, roomId: string) {
    await prisma.unreadMessage.deleteMany({
      where: {
        userId,
        roomId,
      },
    });

    io.to(String(userId)).emit('messages_read', { roomId });
  }

  async deleteMessage(messageId: string, userId: string) {
    // Busca a mensagem para obter o roomId antes de marcar como deletada
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { roomId: true, userId: true, status: true }
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verifica se o usuário é o dono da mensagem
    if (message.userId !== userId) {
      throw new Error('You can only delete your own messages');
    }

    // Verifica se a mensagem já foi deletada
    if (message.status === 'DELETED') {
      throw new Error('Message already deleted');
    }

    // Marca a mensagem como deletada (soft delete)
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { 
        status: 'DELETED',
        content: 'Mensagem deletada'  // Substitui o conteúdo
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Emite para toda a sala com os dados atualizados
    io.to(message.roomId).emit('message_deleted', { 
      messageId, 
      message: updatedMessage 
    });

    return updatedMessage;
  }

  async updateMessage(messageId: string, content: string, userId: string) {
    // Busca a mensagem para obter o roomId antes de editar
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { roomId: true, userId: true, status: true }
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verifica se o usuário é o dono da mensagem
    if (message.userId !== userId) {
      throw new Error('You can only edit your own messages');
    }

    // Verifica se a mensagem foi deletada
    if (message.status === 'DELETED') {
      throw new Error('Cannot edit deleted message');
    }

    // Atualiza a mensagem e marca como editada
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { 
        content,
        status: 'EDITED'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
   
    // Emite para toda a sala com os dados atualizados
    io.to(message.roomId).emit('message_updated', { 
      messageId, 
      content,
      message: updatedMessage
    });

    return updatedMessage;
  }
} 