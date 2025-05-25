import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors';
import { MessageService } from './messageService';
import { io } from '../server';

const prisma = new PrismaClient();
const messageService = new MessageService();

export class RoomService {
  async createRoom(name: string) {
    const existingRoom = await prisma.room.findFirst({
      where: { name },
    });

    if (existingRoom) {
      throw new ConflictError('Room name already exists');
    }

    const room = await prisma.room.create({
      data: { name },
    });

    io.emit('room_created', room);
    return room;
  }

  async deleteRoom(id: string) {
    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    await prisma.room.delete({
      where: { id },
    });

    io.emit('room_deleted', { id });
  }

  async getRoomById(id: string) {
    const room = await prisma.room.findUnique({
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
            createdAt: 'asc',
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    return room;
  }

  async getRooms(userId: string) {
    const rooms = await prisma.room.findMany({
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        unreadMessages: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Map rooms and calculate last activity
    const roomsWithActivity = rooms.map(room => {
      const lastMessage = room.messages[0] || null;
      const lastActivity = lastMessage ? lastMessage.createdAt : room.createdAt;
      
      return {
        ...room,
        lastMessage,
        unreadCount: room.unreadMessages.length,
        lastActivity,
        messages: undefined,
        unreadMessages: undefined,
      };
    });

    // Sort by last activity (most recent first)
    roomsWithActivity.sort((a, b) => {
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });

    // Remove the temporary lastActivity field before returning
    return roomsWithActivity.map(({ lastActivity, ...room }) => room);
  }

  async getRoomMessages(roomId: string, userId: string) {
    const room = await this.getRoomById(roomId);
    await messageService.markMessagesAsRead(userId, roomId);
    return room.messages;
  }

  async getRoomDetails(roomId: string) {
    const room = await prisma.room.findUnique({
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
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // Calculate statistics
    const totalMessages = room.messages.length;
    const activeMessages = room.messages.filter(msg => msg.status === 'ACTIVE').length;
    const editedMessages = room.messages.filter(msg => msg.status === 'EDITED').length;
    const deletedMessages = room.messages.filter(msg => msg.status === 'DELETED').length;

    // Get participants with message count
    const participantMap = new Map();
    room.messages.forEach(msg => {
      const userId = msg.user.id;
      if (participantMap.has(userId)) {
        participantMap.get(userId).messageCount++;
        participantMap.get(userId).lastActiveAt = msg.createdAt;
      } else {
        participantMap.set(userId, {
          userId: msg.user.id,
          username: msg.user.username,
          messageCount: 1,
          lastActiveAt: msg.createdAt,
        });
      }
    });

    const participants = Array.from(participantMap.values());

    // Get shared files (messages with fileUrl)
    const sharedFiles = room.messages
      .filter(msg => msg.fileUrl && msg.status !== 'DELETED')
      .map(msg => ({
        id: msg.id,
        fileName: msg.fileName || 'Arquivo',
        fileType: msg.fileType || 'application/octet-stream',
        fileUrl: msg.fileUrl,
        fileSize: msg.fileSize || 0,
        uploadedBy: msg.user.username,
        uploadedAt: msg.createdAt,
      }));

    // Get first and last message dates
    const firstMessage = room.messages.length > 0 ? room.messages[0] : null;
    const lastMessage = room.messages.length > 0 ? room.messages[room.messages.length - 1] : null;

    return {
      id: room.id,
      name: room.name,
      createdAt: room.createdAt,
      totalMessages,
      totalUsers: participants.length,
      lastMessageAt: lastMessage?.createdAt || null,
      participants,
      sharedFiles,
    };
  }
} 