import { RoomService } from '../../services/roomService';
import { NotFoundError, ConflictError, ForbiddenError } from '../../utils/errors';

// Configurar mocks diretamente
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    room: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    room_member: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

jest.mock('../../services/messageService');

jest.mock('../../server', () => ({
  io: {
    emit: jest.fn(),
    to: jest.fn(() => ({ emit: jest.fn() })),
  },
}));

// Importar os mocks após a configuração
import { PrismaClient } from '@prisma/client';
import { io } from '../../server';

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockIo = io as jest.Mocked<typeof io>;

describe('RoomService', () => {
  let roomService: RoomService;

  beforeEach(() => {
    roomService = new RoomService();
    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    it('deve criar uma sala com sucesso', async () => {
      const roomName = 'Test Room';
      const creatorId = 'creator-id';

      const mockRoom = {
        id: 'room-id',
        name: roomName,
        creator_id: creatorId,
        created_at: new Date(),
        updated_at: new Date(),
        creator: {
          id: creatorId,
          username: 'creator',
        },
        members: [
          {
            user_id: creatorId,
            room_id: 'room-id',
            role: 'ADMIN',
            user: {
              id: creatorId,
              username: 'creator',
            },
          },
        ],
      };

      (mockPrisma.room.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.room.create as jest.Mock).mockResolvedValue(mockRoom);

      const result = await roomService.createRoom(roomName, creatorId);

      expect(mockPrisma.room.findFirst).toHaveBeenCalledWith({
        where: { name: roomName },
      });

      expect(mockPrisma.room.create).toHaveBeenCalledWith({
        data: {
          name: roomName,
          creator_id: creatorId,
          members: {
            create: {
              user_id: creatorId,
              role: 'ADMIN',
            },
          },
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

      expect(result).toEqual(mockRoom);
    });

    it('deve lançar erro se nome da sala já existir', async () => {
      const roomName = 'Existing Room';
      const creatorId = 'creator-id';

      const existingRoom = {
        id: 'existing-id',
        name: roomName,
        creator_id: 'other-creator',
      };

      (mockPrisma.room.findFirst as jest.Mock).mockResolvedValue(existingRoom);

      await expect(
        roomService.createRoom(roomName, creatorId)
      ).rejects.toThrow(ConflictError);

      expect(mockPrisma.room.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteRoom', () => {
    it('deve deletar uma sala com sucesso', async () => {
      const roomId = 'room-id';
      const userId = 'creator-id';

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        creator_id: userId,
        members: [{ user_id: userId }],
      };

      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (mockPrisma.room.delete as jest.Mock).mockResolvedValue(mockRoom);

      await roomService.deleteRoom(roomId, userId);

      expect(mockPrisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: roomId },
        include: {
          members: {
            where: { user_id: userId },
          },
        },
      });

      expect(mockPrisma.room.delete).toHaveBeenCalledWith({
        where: { id: roomId },
      });
    });

    it('deve lançar erro se sala não existir', async () => {
      const roomId = 'nonexistent-id';
      const userId = 'user-id';

      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        roomService.deleteRoom(roomId, userId)
      ).rejects.toThrow(NotFoundError);

      expect(mockPrisma.room.delete).not.toHaveBeenCalled();
    });

    it('deve lançar erro se usuário não for o criador', async () => {
      const roomId = 'room-id';
      const userId = 'user-id';
      const creatorId = 'creator-id';

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        creator_id: creatorId,
        members: [{ user_id: userId }],
      };

      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);

      await expect(
        roomService.deleteRoom(roomId, userId)
      ).rejects.toThrow(ForbiddenError);

      expect(mockPrisma.room.delete).not.toHaveBeenCalled();
    });
  });

  describe('getRoomById', () => {
    it('deve retornar sala com sucesso', async () => {
      const roomId = 'room-id';
      const userId = 'user-id';

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        creator_id: 'creator-id',
        created_at: new Date(),
        members: [
          {
            id: 'member-1',
            user_id: userId,
            room_id: roomId,
            role: 'MEMBER',
            user: {
              id: userId,
              username: 'testuser',
            },
          },
        ],
        messages: [],
      };

      const mockMembership = {
        id: 'member-1',
        user_id: userId,
        room_id: roomId,
        role: 'MEMBER',
      };

      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (mockPrisma.room_member.findUnique as jest.Mock).mockResolvedValue(mockMembership);

      const result = await roomService.getRoomById(roomId, userId);

      expect(mockPrisma.room.findUnique).toHaveBeenCalledWith({
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
              created_at: 'asc',
            },
          },
          members: {
            where: { user_id: userId },
          },
        },
      });

      expect(result).toEqual(mockRoom);
    });

    it('deve lançar erro se sala não existir', async () => {
      const roomId = 'nonexistent-id';
      const userId = 'user-id';

      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        roomService.getRoomById(roomId, userId)
      ).rejects.toThrow(NotFoundError);
    });

    it('deve lançar erro se usuário não for membro', async () => {
      const roomId = 'room-id';
      const userId = 'user-id';

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        creator_id: 'creator-id',
        members: [], // Sem o usuário como membro
      };

      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (mockPrisma.room_member.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        roomService.getRoomById(roomId, userId)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getRooms', () => {
    it('deve retornar salas do usuário ordenadas por atividade', async () => {
      const userId = 'user-id';

      const mockRooms = [
        {
          id: 'room-1',
          name: 'Room 1',
          creator_id: 'creator-1',
          created_at: new Date('2023-01-01'),
          messages: [
            {
              id: 'msg-1',
              content: 'Latest message',
              created_at: new Date('2023-01-02'),
            },
          ],
          unread_messages: [],
          creator: { id: 'creator-1', username: 'creator1' },
          members: [
            {
              user_id: userId,
              user: { id: userId, username: 'testuser' },
            },
          ],
        },
        {
          id: 'room-2',
          name: 'Room 2',
          creator_id: 'creator-2',
          created_at: new Date('2023-01-01'),
          messages: [],
          unread_messages: [],
          creator: { id: 'creator-2', username: 'creator2' },
          members: [
            {
              user_id: userId,
              user: { id: userId, username: 'testuser' },
            },
          ],
        },
      ];

      (mockPrisma.room.findMany as jest.Mock).mockResolvedValue(mockRooms);

      const result = await roomService.getRooms(userId);

      expect(mockPrisma.room.findMany).toHaveBeenCalledWith({
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

      expect(result).toHaveLength(2);
    });
  });

  describe('addMemberToRoom', () => {
    it('deve adicionar membro com sucesso', async () => {
      const roomId = 'room-id';
      const userIdToAdd = 'user-to-add';
      const adminUserId = 'admin-id';

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        creator_id: 'creator-id',
      };

      const mockAdminMember = {
        id: 'admin-member',
        user_id: adminUserId,
        room_id: roomId,
        role: 'ADMIN',
      };

      const mockNewMember = {
        id: 'new-member',
        user_id: userIdToAdd,
        room_id: roomId,
        role: 'MEMBER',
        joined_at: new Date(),
        user: {
          id: userIdToAdd,
          username: 'newuser',
        },
      };

      // Configurar mocks na ordem correta
      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (mockPrisma.room_member.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdminMember) // Para verificar se é admin
        .mockResolvedValueOnce(null); // Para verificar se já é membro
      (mockPrisma.room_member.create as jest.Mock).mockResolvedValue(mockNewMember);
      (mockPrisma.room_member.findMany as jest.Mock).mockResolvedValue([
        { user_id: adminUserId },
        { user_id: userIdToAdd },
      ]);

      const result = await roomService.addMemberToRoom(roomId, userIdToAdd, adminUserId);

      expect(mockPrisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: roomId },
      });

      expect(mockPrisma.room_member.create).toHaveBeenCalledWith({
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

      expect(result).toEqual(mockNewMember);
    });

    it('deve lançar erro se usuário não for admin', async () => {
      const roomId = 'room-id';
      const userIdToAdd = 'user-to-add';
      const adminUserId = 'non-admin-id';

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        creator_id: 'creator-id',
      };

      const mockMember = {
        id: 'member',
        user_id: adminUserId,
        room_id: roomId,
        role: 'MEMBER', // Não é admin
      };

      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (mockPrisma.room_member.findUnique as jest.Mock).mockResolvedValue(mockMember);

      await expect(
        roomService.addMemberToRoom(roomId, userIdToAdd, adminUserId)
      ).rejects.toThrow(ForbiddenError);

      expect(mockPrisma.room_member.create).not.toHaveBeenCalled();
    });

    it('deve lançar erro se usuário já for membro', async () => {
      const roomId = 'room-id';
      const userIdToAdd = 'user-to-add';
      const adminUserId = 'admin-id';

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        creator_id: 'creator-id',
      };

      const mockAdminMember = {
        id: 'admin-member',
        user_id: adminUserId,
        room_id: roomId,
        role: 'ADMIN',
      };

      const mockExistingMember = {
        id: 'existing-member',
        user_id: userIdToAdd,
        room_id: roomId,
        role: 'MEMBER',
      };

      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (mockPrisma.room_member.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdminMember) // Para verificar se é admin
        .mockResolvedValueOnce(mockExistingMember); // Para verificar se já é membro

      await expect(
        roomService.addMemberToRoom(roomId, userIdToAdd, adminUserId)
      ).rejects.toThrow(ConflictError);

      expect(mockPrisma.room_member.create).not.toHaveBeenCalled();
    });
  });

  describe('removeMemberFromRoom', () => {
    it('deve remover membro com sucesso', async () => {
      const roomId = 'room-id';
      const userIdToRemove = 'user-to-remove';
      const adminUserId = 'admin-id';

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        creator_id: 'creator-id',
      };

      const mockAdminMember = {
        id: 'admin-member',
        user_id: adminUserId,
        room_id: roomId,
        role: 'ADMIN',
      };

      const mockMemberToRemove = {
        id: 'member-to-remove',
        user_id: userIdToRemove,
        room_id: roomId,
        role: 'MEMBER',
      };

      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (mockPrisma.room_member.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdminMember) // Para verificar se é admin
        .mockResolvedValueOnce(mockMemberToRemove); // Para verificar se o membro existe
      (mockPrisma.room_member.delete as jest.Mock).mockResolvedValue(mockMemberToRemove);
      (mockPrisma.room_member.findMany as jest.Mock).mockResolvedValue([
        { user_id: adminUserId },
      ]);

      const result = await roomService.removeMemberFromRoom(roomId, userIdToRemove, adminUserId);

      expect(mockPrisma.room_member.delete).toHaveBeenCalledWith({
        where: {
          user_id_room_id: {
            user_id: userIdToRemove,
            room_id: roomId,
          },
        },
      });

      expect(result).toEqual({ success: true });
    });

    it('deve lançar erro ao tentar remover o criador', async () => {
      const roomId = 'room-id';
      const creatorId = 'creator-id';
      const adminUserId = 'admin-id';

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        creator_id: creatorId,
      };

      const mockAdminMember = {
        id: 'admin-member',
        user_id: adminUserId,
        room_id: roomId,
        role: 'ADMIN',
      };

      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (mockPrisma.room_member.findUnique as jest.Mock).mockResolvedValue(mockAdminMember);

      await expect(
        roomService.removeMemberFromRoom(roomId, creatorId, adminUserId)
      ).rejects.toThrow(ForbiddenError);

      expect(mockPrisma.room_member.delete).not.toHaveBeenCalled();
    });
  });

  describe('getAvailableUsers', () => {
    it('deve retornar usuários disponíveis para adição', async () => {
      const roomId = 'room-id';
      const userId = 'admin-id';

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        creator_id: 'creator-id',
      };

      const mockAdminMember = {
        id: 'admin-member',
        user_id: userId,
        room_id: roomId,
        role: 'ADMIN',
      };

      const mockAvailableUsers = [
        {
          id: 'user-2',
          username: 'user2',
        },
        {
          id: 'user-3',
          username: 'user3',
        },
      ];

      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (mockPrisma.room_member.findUnique as jest.Mock).mockResolvedValue(mockAdminMember);
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockAvailableUsers);

      const result = await roomService.getAvailableUsers(roomId, userId);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
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

      expect(result).toEqual(mockAvailableUsers);
    });

    it('deve lançar erro se usuário não for admin', async () => {
      const roomId = 'room-id';
      const userId = 'non-admin-id';

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        creator_id: 'creator-id',
      };

      const mockMember = {
        id: 'member',
        user_id: userId,
        room_id: roomId,
        role: 'MEMBER', // Não é admin
      };

      (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (mockPrisma.room_member.findUnique as jest.Mock).mockResolvedValue(mockMember);

      await expect(
        roomService.getAvailableUsers(roomId, userId)
      ).rejects.toThrow(ForbiddenError);

      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });
  });
}); 