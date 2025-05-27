import { UserService } from '../../services/userService';
import { AppError, NotFoundError } from '../../utils/errors';
import { Response } from 'express';

// Configurar mocks diretamente
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
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

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

// Importar os mocks após a configuração
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('UserService', () => {
  let userService: UserService;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    userService = new UserService();
    mockResponse = {
      cookie: jest.fn(),
    };
    
    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('deve criar um usuário com sucesso', async () => {
      const username = 'testuser';
      const password = 'password123';
      const hashedPassword = 'hashed-password';
      const userId = 'user-id-123';
      const token = 'mock-token';

      const mockUser = {
        id: userId,
        username,
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Configurar mocks
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (mockJwt.sign as jest.Mock).mockReturnValue(token);

      const result = await userService.createUser(username, password, mockResponse as Response);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          username,
          password: hashedPassword,
        },
      });
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId, username },
        expect.any(String),
        { expiresIn: "24h" }
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
      });
      expect(result).toEqual({ user: mockUser, token });
    });

    it('deve lançar erro se o usuário já existir', async () => {
      const username = 'existinguser';
      const password = 'password123';

      const existingUser = {
        id: 'existing-id',
        username,
        password: 'existing-password',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      await expect(
        userService.createUser(username, password, mockResponse as Response)
      ).rejects.toThrow(AppError);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const username = 'testuser';
      const password = 'password123';
      const userId = 'user-id-123';
      const hashedPassword = 'hashed-password';
      const token = 'mock-token';

      const mockUser = {
        id: userId,
        username,
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue(token);

      const result = await userService.login(username, password, mockResponse as Response);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId, username },
        expect.any(String),
        { expiresIn: "24h" }
      );
      expect(result).toEqual({ user: mockUser, token });
    });

    it('deve lançar erro se o usuário não existir', async () => {
      const username = 'nonexistent';
      const password = 'password123';

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.login(username, password, mockResponse as Response)
      ).rejects.toThrow(AppError);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('deve lançar erro se a senha estiver incorreta', async () => {
      const username = 'testuser';
      const password = 'wrongpassword';
      const hashedPassword = 'hashed-password';

      const mockUser = {
        id: 'user-id-123',
        username,
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        userService.login(username, password, mockResponse as Response)
      ).rejects.toThrow(AppError);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('deve retornar um usuário por ID', async () => {
      const userId = 'user-id-123';
      const mockUser = {
        id: userId,
        username: 'testuser',
        messages: [
          {
            id: 'msg-1',
            content: 'Test message',
            created_at: new Date(),
            room_id: 'room-1',
          },
        ],
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          messages: {
            select: {
              id: true,
              content: true,
              created_at: true,
              room_id: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('deve lançar erro se o usuário não for encontrado', async () => {
      const userId = 'nonexistent-id';

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(userService.getUserById(userId)).rejects.toThrow(NotFoundError);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          messages: {
            select: {
              id: true,
              content: true,
              created_at: true,
              room_id: true,
            },
          },
        },
      });
    });
  });

  describe('getUsers', () => {
    it('deve retornar todos os usuários', async () => {
      const mockUsers = [
        { id: 'user-1', username: 'user1' },
        { id: 'user-2', username: 'user2' },
        { id: 'user-3', username: 'user3' },
      ];

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userService.getUsers();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          username: true,
        },
      });
      expect(result).toEqual(mockUsers);
    });

    it('deve retornar array vazio se não houver usuários', async () => {
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await userService.getUsers();

      expect(result).toEqual([]);
    });
  });
}); 