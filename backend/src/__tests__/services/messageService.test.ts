import { MessageService } from '../../services/messageService';
import { ForbiddenError, NotFoundError } from '../../utils/errors';

// Interface para arquivos
interface FileInfo {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

// Configurar mocks diretamente
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    room_member: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    unread_message: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  })),
}));

jest.mock('../../server', () => ({
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
  getActiveViewers: jest.fn(() => new Set()),
}));

// Importar os mocks após a configuração
import { PrismaClient } from '@prisma/client';
import { io } from '../../server';

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockIo = io as jest.Mocked<typeof io>;

describe('MessageService', () => {
  let messageService: MessageService;

  beforeEach(() => {
    messageService = new MessageService();
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('deve criar uma mensagem com sucesso', async () => {
      const content = 'Test message';
      const userId = 'user-1';
      const roomId = 'room-1';
      const files: FileInfo[] = [];

      const mockRoomMember = {
        id: 'member-1',
        user_id: userId,
        room_id: roomId,
        role: 'MEMBER',
        room: { id: roomId, name: 'Test Room' },
      };

      const mockMessage = {
        id: 'message-1',
        content,
        user_id: userId,
        room_id: roomId,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        files: [],
        user: {
          id: userId,
          username: 'testuser',
        },
      };

      // Configurar mocks
      (mockPrisma.room_member.findUnique as jest.Mock).mockResolvedValue(mockRoomMember);
      (mockPrisma.message.create as jest.Mock).mockResolvedValue(mockMessage);
      (mockPrisma.room_member.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.unread_message.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.unread_message.count as jest.Mock).mockResolvedValue(1);

      const result = await messageService.createMessage(content, userId, roomId, files);

      expect(mockPrisma.room_member.findUnique).toHaveBeenCalledWith({
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

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          content,
          room_id: roomId,
          user_id: userId,
          files: undefined,
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

      expect(result).toEqual(mockMessage);
    });

    it('deve criar mensagem com arquivos', async () => {
      const content = 'Message with files';
      const userId = 'user-1';
      const roomId = 'room-1';
      const files: FileInfo[] = [
        {
          fileName: 'test.txt',
          fileUrl: '/uploads/test.txt',
          fileType: 'text/plain',
          fileSize: 1024,
        },
      ];

      const mockRoomMember = {
        id: 'member-1',
        user_id: userId,
        room_id: roomId,
        role: 'MEMBER',
        room: { id: roomId, name: 'Test Room' },
      };

      const mockMessage = {
        id: 'message-1',
        content,
        user_id: userId,
        room_id: roomId,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        files: [
          {
            id: 'file-1',
            file_name: 'test.txt',
            file_url: '/uploads/test.txt',
            file_type: 'text/plain',
            file_size: 1024,
          },
        ],
        user: {
          id: userId,
          username: 'testuser',
        },
      };

      // Configurar mocks
      (mockPrisma.room_member.findUnique as jest.Mock).mockResolvedValue(mockRoomMember);
      (mockPrisma.message.create as jest.Mock).mockResolvedValue(mockMessage);
      (mockPrisma.room_member.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.unread_message.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.unread_message.count as jest.Mock).mockResolvedValue(1);

      const result = await messageService.createMessage(content, userId, roomId, files);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          content,
          room_id: roomId,
          user_id: userId,
          files: {
            create: [
              {
                file_name: 'test.txt',
                file_url: '/uploads/test.txt',
                file_type: 'text/plain',
                file_size: 1024,
              },
            ],
          },
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

      expect(result).toEqual(mockMessage);
    });
  });

  describe('getMessages', () => {
    it('deve retornar mensagens paginadas', async () => {
      const roomId = 'room-1';
      const userId = 'user-1';
      const page = 1;
      const limit = 20;

      const mockRoomMember = {
        id: 'member-1',
        user_id: userId,
        room_id: roomId,
        role: 'MEMBER',
      };

      const mockMessages = [
        {
          id: 'message-1',
          content: 'Test message 1',
          user_id: userId,
          room_id: roomId,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          user: {
            id: userId,
            username: 'testuser',
          },
          files: [],
        },
      ];

      const mockTotal = 15;

      // Configurar mocks
      (mockPrisma.room_member.findUnique as jest.Mock).mockResolvedValue(mockRoomMember);
      (mockPrisma.message.findMany as jest.Mock).mockResolvedValue(mockMessages);
      (mockPrisma.message.count as jest.Mock).mockResolvedValue(mockTotal);
      (mockPrisma.unread_message.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await messageService.getMessages(roomId, userId, page, limit);

      expect(mockPrisma.room_member.findUnique).toHaveBeenCalledWith({
        where: {
          user_id_room_id: {
            user_id: userId,
            room_id: roomId,
          },
        },
      });

      expect(result.total).toBe(mockTotal);
      expect(result.pages).toBe(Math.ceil(mockTotal / limit));
      expect(result.currentPage).toBe(page);
      expect(result.limit).toBe(limit);
      expect(result.messages).toHaveLength(mockMessages.length);
    });
  });

  describe('deleteMessage', () => {
    it('deve deletar mensagem com sucesso', async () => {
      const messageId = 'message-1';
      const userId = 'user-1';

      const mockMessage = {
        id: messageId,
        room_id: 'room-1',
        user_id: userId,
        status: 'SENT',
      };

      const mockUpdatedMessage = {
        ...mockMessage,
        status: 'DELETED',
        content: 'Mensagem deletada',
        user: {
          id: userId,
          username: 'testuser',
        },
        files: [],
      };

      // Configurar mocks
      (mockPrisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (mockPrisma.message.update as jest.Mock).mockResolvedValue(mockUpdatedMessage);

      const result = await messageService.deleteMessage(messageId, userId);

      expect(mockPrisma.message.findUnique).toHaveBeenCalledWith({
        where: { id: messageId },
        select: { room_id: true, user_id: true, status: true },
      });

      expect(mockPrisma.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: {
          status: 'DELETED',
          content: 'Mensagem deletada',
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

      expect(result).toEqual(mockUpdatedMessage);
    });

    it('deve lançar erro se o usuário não for o dono da mensagem', async () => {
      const messageId = 'message-1';
      const userId = 'user-2';

      const mockMessage = {
        id: messageId,
        room_id: 'room-1',
        user_id: 'user-1', // Diferente do userId
        status: 'SENT',
      };

      // Configurar mocks
      (mockPrisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      await expect(
        messageService.deleteMessage(messageId, userId)
      ).rejects.toThrow('You can only delete your own messages');

      expect(mockPrisma.message.update).not.toHaveBeenCalled();
    });

    it('deve lançar erro se a mensagem já foi deletada', async () => {
      const messageId = 'message-1';
      const userId = 'user-1';

      const mockMessage = {
        id: messageId,
        room_id: 'room-1',
        user_id: userId,
        status: 'DELETED',
      };

      // Configurar mocks
      (mockPrisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      await expect(
        messageService.deleteMessage(messageId, userId)
      ).rejects.toThrow('Message already deleted');

      expect(mockPrisma.message.update).not.toHaveBeenCalled();
    });
  });

  describe('updateMessage', () => {
    it('deve atualizar mensagem com sucesso', async () => {
      const messageId = 'message-1';
      const content = 'Updated content';
      const userId = 'user-1';

      const mockMessage = {
        id: messageId,
        room_id: 'room-1',
        user_id: userId,
        status: 'SENT',
      };

      const mockUpdatedMessage = {
        ...mockMessage,
        content,
        status: 'EDITED',
        user: {
          id: userId,
          username: 'testuser',
        },
        files: [],
      };

      // Configurar mocks
      (mockPrisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (mockPrisma.message.update as jest.Mock).mockResolvedValue(mockUpdatedMessage);

      const result = await messageService.updateMessage(messageId, content, userId);

      expect(mockPrisma.message.findUnique).toHaveBeenCalledWith({
        where: { id: messageId },
        select: { room_id: true, user_id: true, status: true },
      });

      expect(mockPrisma.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: {
          content,
          status: 'EDITED',
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

      expect(result).toEqual(mockUpdatedMessage);
    });

    it('deve lançar erro se tentar editar mensagem deletada', async () => {
      const messageId = 'message-1';
      const content = 'Updated content';
      const userId = 'user-1';

      const mockMessage = {
        id: messageId,
        room_id: 'room-1',
        user_id: userId,
        status: 'DELETED',
      };

      // Configurar mocks
      (mockPrisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      await expect(
        messageService.updateMessage(messageId, content, userId)
      ).rejects.toThrow('Cannot edit deleted message');

      expect(mockPrisma.message.update).not.toHaveBeenCalled();
    });
  });

  describe('getUnreadCounts', () => {
    it('deve retornar contadores de mensagens não lidas', async () => {
      const userId = 'user-1';

      const mockUnreadCounts = [
        {
          room_id: 'room-1',
          _count: { _all: 5 },
        },
        {
          room_id: 'room-2',
          _count: { _all: 3 },
        },
      ];

      // Configurar mocks
      (mockPrisma.unread_message.groupBy as jest.Mock).mockResolvedValue(mockUnreadCounts);

      const result = await messageService.getUnreadCounts(userId);

      expect(result).toEqual([
        { roomId: 'room-1', count: 5 },
        { roomId: 'room-2', count: 3 },
      ]);
    });
  });

  describe('markMessagesAsRead', () => {
    it('deve marcar mensagens como lidas', async () => {
      const userId = 'user-1';
      const roomId = 'room-1';

      // Configurar mocks
      (mockPrisma.unread_message.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

      await messageService.markMessagesAsRead(userId, roomId);

      expect(mockPrisma.unread_message.deleteMany).toHaveBeenCalledWith({
        where: {
          user_id: userId,
          room_id: roomId,
        },
      });

      expect(mockIo.to).toHaveBeenCalledWith(String(userId));
      expect(mockIo.emit).toHaveBeenCalledWith('messages_read', { roomId });
    });
  });

  describe('getTotalMessages', () => {
    it('deve retornar total de mensagens em uma sala', async () => {
      const roomId = 'room-1';
      const expectedTotal = 42;

      // Configurar mocks
      (mockPrisma.message.count as jest.Mock).mockResolvedValue(expectedTotal);

      const result = await messageService.getTotalMessages(roomId);

      expect(mockPrisma.message.count).toHaveBeenCalledWith({
        where: { room_id: roomId },
      });
      expect(result).toBe(expectedTotal);
    });
  });
}); 