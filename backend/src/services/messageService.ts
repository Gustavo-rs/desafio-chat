import { PrismaClient } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors';
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
  async createMessage(content: string, userId: string, roomId: string, files?: FileInfo[]) {
    // Verificar se o usuário é membro da sala
    const roomMembership = await prisma.room_member.findUnique({
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
      throw new ForbiddenError('You are not a member of this room');
    }

    // Create message with files
    const message = await prisma.message.create({
      data: {
        content,
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

    // Get all room members except the sender
    const roomMembers = await prisma.room_member.findMany({
      where: {
        room_id: roomId,
        user_id: {
          not: userId,
        },
      },
      include: {
        user: true,
      },
    });

    // Get users currently viewing this room
    const activeViewers = getActiveViewers(roomId);

    // Create unread entries for all other room members who are NOT actively viewing the room
    for (const member of roomMembers) {
      // Skip notification if user is actively viewing the room
      if (activeViewers.has(member.user.id)) {
        console.log(`⏭️ Skipping notification for ${member.user.username} - actively viewing room ${roomId}`);
        continue;
      }

      await prisma.unread_message.create({
        data: {
          message_id: message.id,
          user_id: member.user.id,
          room_id: roomId,
        },
      });

      // Get unread count for this user and room
      const unreadCount = await prisma.unread_message.count({
        where: {
          user_id: member.user.id,
          room_id: roomId,
        },
      });

      io.to(String(member.user.id)).emit('unread_message', {
        roomId,
        lastMessage: message,
        count: unreadCount,
      });
    }

    // Emitir apenas uma vez globalmente com estrutura adequada para ambos os casos
    io.emit('receive_message', { roomId, message });
    
    return message;
  }

  async getMessages(roomId: string, userId: string, page: number, limit: number): Promise<MessageResponse> {
    // Verificar se o usuário é membro da sala
    const roomMembership = await prisma.room_member.findUnique({
      where: {
        user_id_room_id: {
          user_id: userId,
          room_id: roomId,
        },
      },
    });

    if (!roomMembership) {
      throw new ForbiddenError('You are not a member of this room');
    }

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
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
      prisma.message.count({ 
        where: { 
          room_id: roomId
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
      messages: orderedMessages.map(msg => ({
        ...msg,
        roomId: msg.room_id,
        userId: msg.user_id,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at,
      })) as any,
    };
  }

  async getTotalMessages(roomId: string) {
    return prisma.message.count({
      where: { room_id: roomId },
    });
  }

  async getUnreadCounts(userId: string): Promise<UnreadCount[]> {
    const unreadCounts = await prisma.unread_message.groupBy({
      by: ["room_id"],
      where: {
        user_id: userId,
      },
      _count: {
        _all: true,
      },
    });

    return unreadCounts.map((count: any) => ({
      roomId: count.room_id,
      count: count._count._all,
    }));
  }

  async getUnreadCount(userId: string, roomId: string) {
    return prisma.unread_message.count({
      where: {
        user_id: userId,
        room_id: roomId,
      },
    });
  }

  async markMessagesAsRead(userId: string, roomId: string) {
    await prisma.unread_message.deleteMany({
      where: {
        user_id: userId,
        room_id: roomId,
      },
    });

    io.to(String(userId)).emit('messages_read', { roomId });
  }

  async deleteMessage(messageId: string, userId: string) {
    // Busca a mensagem para obter o roomId antes de marcar como deletada
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { room_id: true, user_id: true, status: true }
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verifica se o usuário é o dono da mensagem
    if (message.user_id !== userId) {
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
    io.to(message.room_id).emit('message_deleted', { 
      messageId, 
      message: updatedMessage 
    });

    return updatedMessage;
  }

  async updateMessage(messageId: string, content: string, userId: string) {
    // Busca a mensagem para obter o roomId antes de editar
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { room_id: true, user_id: true, status: true }
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verifica se o usuário é o dono da mensagem
    if (message.user_id !== userId) {
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
    io.to(message.room_id).emit('message_updated', { 
      messageId, 
      content,
      message: updatedMessage
    });

    return updatedMessage;
  }
} 