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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return rooms.map(room => ({
      ...room,
      lastMessage: room.messages[0] || null,
      unreadCount: room.unreadMessages.length,
      messages: undefined,
      unreadMessages: undefined,
    }));
  }

  async getRoomMessages(roomId: string, userId: string) {
    const room = await this.getRoomById(roomId);
    await messageService.markMessagesAsRead(userId, roomId);
    return room.messages;
  }
} 