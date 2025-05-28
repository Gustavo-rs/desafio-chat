import { UserService } from '../../services/user/UserService';
import { mockPrisma } from '../setup';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock das dependências
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = 'test-user-id';
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

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
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

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(userId)).rejects.toThrow('Usuário não encontrado');
    });

    it('should validate user ID format', async () => {
      // Arrange
      const invalidId = '';

      // Act & Assert
      await expect(userService.getUserById(invalidId)).rejects.toThrow('ID do usuário inválido');
    });
  });

  describe('userExists', () => {
    it('should return true when user exists', async () => {
      // Arrange
      const userId = 'existing-user-id';
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId } as any);

      // Act
      const result = await userService.userExists(userId);

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true },
      });
    });

    it('should return false when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userService.userExists(userId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getUsers', () => {
    it('should return list of users', async () => {
      // Arrange
      const mockUsers = [
        { id: '1', username: 'user1' },
        { id: '2', username: 'user2' },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      // Act
      const result = await userService.getUsers();

      // Assert
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          username: true,
        },
      });
      expect(result).toEqual(mockUsers);
    });
  });
}); 