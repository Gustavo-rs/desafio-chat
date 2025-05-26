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

    // Criar a sala e automaticamente adicionar o criador como ADMIN
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

    // Emitir evento apenas para os membros da sala
    const memberIds = room.members.map(member => member.user_id);
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

    // Verificar se o usuário é o criador da sala
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

    // Verificar se o usuário é membro da sala
    if (room.members.length === 0) {
      throw new ForbiddenError('You are not a member of this room');
    }

    return room;
  }

  async getRooms(userId: string) {
    // Buscar apenas salas onde o usuário é membro
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

    // Map rooms and calculate last activity
    const roomsWithActivity = rooms.map(room => {
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

    // Sort by last activity (most recent first)
    roomsWithActivity.sort((a, b) => {
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });

    // Remove the temporary lastActivity field before returning
    return roomsWithActivity.map(({ lastActivity, ...room }) => room);
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

    // Verificar se o usuário é membro da sala
    const userMembership = room.members.find(member => member.user_id === userId);
    if (!userMembership) {
      throw new ForbiddenError('You are not a member of this room');
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

    // Get shared files (messages with files)
    const sharedFiles = room.messages
      .filter(msg => msg.files && msg.files.length > 0 && msg.status !== 'DELETED')
      .flatMap(msg => 
        msg.files.map(file => ({
          id: file.id,
          fileName: file.file_name || 'Arquivo',
          fileType: file.file_type || 'application/octet-stream',
          fileUrl: file.file_url,
          fileSize: file.file_size || 0,
          uploadedBy: msg.user.username,
          uploadedAt: msg.created_at,
        }))
      );

    // Get first and last message dates
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

  // Adicionar usuário à sala (apenas ADMIN pode fazer isso)
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

    // Verificar se o usuário que está adicionando é ADMIN
    const adminMembership = room.members.find(member => member.user_id === adminUserId);
    if (!adminMembership || adminMembership.role !== 'ADMIN') {
      throw new ForbiddenError('Only room admins can add members');
    }

    // Verificar se o usuário já é membro
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

    // Verificar se o usuário existe
    const userToAdd = await prisma.user.findUnique({
      where: { id: userIdToAdd },
      select: { id: true, username: true },
    });

    if (!userToAdd) {
      throw new NotFoundError('User not found');
    }

    // Adicionar o usuário à sala
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

    // Emitir evento para todos os membros da sala
    const allMembers = await prisma.room_member.findMany({
      where: { room_id: roomId },
      select: { user_id: true },
    });
    
    const memberIds = allMembers.map(member => member.user_id);
    io.to(memberIds).emit('member_added', {
      roomId,
      member: newMember,
    });

    return newMember;
  }

  // Remover usuário da sala (apenas ADMIN pode fazer isso)
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

    // Verificar se o usuário que está removendo é ADMIN
    const adminMembership = room.members.find(member => member.user_id === adminUserId);
    if (!adminMembership || adminMembership.role !== 'ADMIN') {
      throw new ForbiddenError('Only room admins can remove members');
    }

    // Não permitir remover o criador da sala
    if (userIdToRemove === room.creator_id) {
      throw new ForbiddenError('Cannot remove the room creator');
    }

    // Verificar se o usuário é membro
    const memberToRemove = room.members.find(member => member.user_id === userIdToRemove);
    if (!memberToRemove) {
      throw new NotFoundError('User is not a member of this room');
    }

    // Remover o usuário da sala
    await prisma.room_member.delete({
      where: {
        user_id_room_id: {
          user_id: userIdToRemove,
          room_id: roomId,
        },
      },
    });

    // Emitir evento para todos os membros da sala (incluindo o usuário removido)
    const remainingMembers = await prisma.room_member.findMany({
      where: { room_id: roomId },
      select: { user_id: true },
    });
    
    const memberIds = remainingMembers.map(member => member.user_id);
    // Adicionar o usuário removido à lista para que ele também receba a notificação
    const allNotificationIds = [...memberIds, userIdToRemove];
    
    io.to(allNotificationIds).emit('member_removed', {
      roomId,
      removedUserId: userIdToRemove,
    });

    return { success: true };
  }

  // Buscar usuários que podem ser adicionados à sala
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

    // Verificar se o usuário é ADMIN
    const adminMembership = room.members.find(member => member.user_id === adminUserId);
    console.log(`👤 Admin membership:`, adminMembership);
    
    if (!adminMembership || adminMembership.role !== 'ADMIN') {
      throw new ForbiddenError('Only room admins can view available users');
    }

    // Buscar usuários que não são membros da sala
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