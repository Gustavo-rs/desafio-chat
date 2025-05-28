import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';
import { MessageService } from './messageService';
import { io } from '../server';

const prisma = new PrismaClient();
const messageService = new MessageService();

export class RoomService {
  async createRoom(name: string, creatorId: string) {
    const existingRoom = await prisma.room.findFirst({
      where: { name },
    });

    if (existingRoom) {
      throw new ConflictError('Room name already exists');
    }

    const room = await prisma.room.create({
      data: { 
        name,
        creator_id: creatorId,
        members: {
          create: {
            user_id: creatorId,
            role: 'ADMIN'
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
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
      },
    });

    const memberIds = room.members.map((member: { user_id: string }) => member.user_id);
    io.to(memberIds).emit('room_created', room);
    
    return room;
  }

  async deleteRoom(id: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        members: {
          where: { user_id: userId },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.creator_id !== userId) {
      throw new ForbiddenError('Only the room creator can delete the room');
    }

    await prisma.room.delete({
      where: { id },
    });

    io.emit('room_deleted', { id });
  }

  async getRoomById(id: string, userId: string) {
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
            created_at: 'asc',
          },
        },
        members: {
          where: { user_id: userId },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.members.length === 0) {
      throw new ForbiddenError('You are not a member of this room');
    }

    return room;
  }

  async getRooms(userId: string) {
    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        messages: {
          orderBy: {
            created_at: 'desc',
          },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
            files: true,
          },
        },
        unread_messages: {
          where: {
            user_id: userId,
          },
          select: {
            id: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
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
      },
    });

    const roomsWithActivity = rooms.map((room: any) => {
      const lastMessage = room.messages[0] || null;
      const lastActivity = lastMessage ? lastMessage.created_at : room.created_at;
      
      return {
        ...room,
        lastMessage,
        unreadCount: room.unread_messages.length,
        lastActivity,
        messages: undefined,
        unread_messages: undefined,
      };
    });

    roomsWithActivity.sort((a: any, b: any) => {
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });

    return roomsWithActivity.map(({ lastActivity, ...room }: { lastActivity: any; [key: string]: any }) => room);
  }

  async getRoomMessages(roomId: string, userId: string) {
    const room = await this.getRoomById(roomId, userId);
    await messageService.markMessagesAsRead(userId, roomId);
    return room.messages;
  }

  async getRoomDetails(roomId: string, userId: string) {
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
      throw new NotFoundError('Room not found');
    }

    const userMembership = room.members.find((member: { user_id: string; role: string }) => member.user_id === userId);
    if (!userMembership) {
      throw new ForbiddenError('You are not a member of this room');
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
      totalUsers: room.members.length,
      lastMessageAt: lastMessage?.created_at || null,
      participants,
      sharedFiles,
      members: room.members,
      userRole: userMembership.role,
    };
  }

  async addMemberToRoom(roomId: string, userIdToAdd: string, adminUserId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          where: { user_id: adminUserId },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const adminMembership = room.members.find((member: { user_id: string; role: string }) => member.user_id === adminUserId);
    if (!adminMembership || adminMembership.role !== 'ADMIN') {
      throw new ForbiddenError('Only room admins can add members');
    }

    const existingMember = await prisma.room_member.findUnique({
      where: {
        user_id_room_id: {
          user_id: userIdToAdd,
          room_id: roomId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError('User is already a member of this room');
    }

    const userToAdd = await prisma.user.findUnique({
      where: { id: userIdToAdd },
      select: { id: true, username: true },
    });

    if (!userToAdd) {
      throw new NotFoundError('User not found');
    }

    const newMember = await prisma.room_member.create({
      data: {
        user_id: userIdToAdd,
        room_id: roomId,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const allMembers = await prisma.room_member.findMany({
      where: { room_id: roomId },
      select: { user_id: true },
    });
    
    const memberIds = allMembers.map((member: { user_id: string }) => member.user_id);
    io.to(memberIds).emit('member_added', {
      roomId,
      member: newMember,
    });

    return newMember;
  }

  async removeMemberFromRoom(roomId: string, userIdToRemove: string, adminUserId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: true,
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const adminMembership = room.members.find((member: { user_id: string; role: string }) => member.user_id === adminUserId);
    if (!adminMembership || adminMembership.role !== 'ADMIN') {
      throw new ForbiddenError('Only room admins can remove members');
    }

    if (userIdToRemove === room.creator_id) {
      throw new ForbiddenError('Cannot remove the room creator');
    }

    const memberToRemove = room.members.find((member: { user_id: string; role: string }) => member.user_id === userIdToRemove);
    if (!memberToRemove) {
      throw new NotFoundError('User is not a member of this room');
    }

    await prisma.room_member.delete({
      where: {
        user_id_room_id: {
          user_id: userIdToRemove,
          room_id: roomId,
        },
      },
    });

    const remainingMembers = await prisma.room_member.findMany({
      where: { room_id: roomId },
      select: { user_id: true },
    });
    
    const memberIds = remainingMembers.map((member: { user_id: string }) => member.user_id);
    const allNotificationIds = [...memberIds, userIdToRemove];
    
    io.to(allNotificationIds).emit('member_removed', {
      roomId,
      removedUserId: userIdToRemove,
    });

    return { success: true };
  }

  async getAvailableUsers(roomId: string, adminUserId: string) {
    console.log(`🔍 Buscando usuários disponíveis para sala ${roomId} pelo admin ${adminUserId}`);
    
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          where: { user_id: adminUserId },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const adminMembership = room.members.find((member: { user_id: string; role: string }) => member.user_id === adminUserId);
    console.log(`👤 Admin membership:`, adminMembership);
    
    if (!adminMembership || adminMembership.role !== 'ADMIN') {
      throw new ForbiddenError('Only room admins can view available users');
    }

    const availableUsers = await prisma.user.findMany({
      where: {
        NOT: {
          room_memberships: {
            some: {
              room_id: roomId,
            },
          },
        },
      },
      select: {
        id: true,
        username: true,
      },
    });

    console.log(`✅ Usuários disponíveis encontrados:`, availableUsers);
    return availableUsers;
  }
} 