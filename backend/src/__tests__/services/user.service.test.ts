import { UserService } from '../../services/user/UserService';
import { mockPrisma } from '../setup';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

    it('should throw error when user not found', async () => {

      const userId = 'non-existent-user';
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.getUserById(userId)).rejects.toThrow('Usuário não encontrado');
    });

    it('should validate user ID format', async () => {

      const invalidId = '';

      await expect(userService.getUserById(invalidId)).rejects.toThrow('ID do usuário inválido');
    });
  });

  describe('userExists', () => {
    it('should return true when user exists', async () => {
      
      const userId = 'existing-user-id';
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId } as any);

      const result = await userService.userExists(userId);

      expect(result).toBe(true);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true },
      });
    });

    it('should return false when user does not exist', async () => {

      const userId = 'non-existent-user';
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.userExists(userId);

      expect(result).toBe(false);
    });
  });

  describe('getUsers', () => {
    it('should return list of users', async () => {

      const mockUsers = [
        { id: '1', username: 'user1' },
        { id: '2', username: 'user2' },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await userService.getUsers();

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