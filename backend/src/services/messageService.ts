import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import { io } from '../server';
import { MessageResponse, UnreadCount } from "../models/message.model";

const prisma = new PrismaClient();

export class MessageService {
  async createMessage(content: string, roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const message = await prisma.message.create({
      data: {
        content,
        roomId,
        userId,
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

    // Get all users except the sender
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
      },
    });

    // Create unread entries for all other users
    for (const user of users) {
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
        where: { roomId },
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
      prisma.message.count({ where: { roomId } }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      total,
      pages,
      currentPage: page,
      limit,
      messages,
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
  }
} 