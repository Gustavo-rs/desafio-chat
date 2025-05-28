// Mock do server.ts para evitar dependência circular
jest.mock('../../server', () => ({
  io: {
    engine: { clientsCount: 0 },
  },
}));

// Mock do módulo Redis config
jest.mock('../../config/redis', () => ({
  redisClient: {
    hset: jest.fn(),
    hdel: jest.fn(),
    hgetall: jest.fn(),
    hlen: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    sismember: jest.fn(),
    expire: jest.fn(),
    setex: jest.fn(),
    get: jest.fn(),
    keys: jest.fn(),
    pipeline: jest.fn(() => ({
      exec: jest.fn(),
    })),
  },
}));

// Mock process.env
const mockEnv = process.env;
beforeAll(() => {
  process.env = { ...mockEnv, SERVER_ID: 'test-server' };
});

afterAll(() => {
  process.env = mockEnv;
});

import { ScalingService } from '../../services/scalingService';
import { redisClient } from '../../config/redis';

const mockRedis = redisClient as jest.Mocked<typeof redisClient>;

describe('ScalingService', () => {
  let scalingService: ScalingService;

  beforeEach(() => {
    scalingService = ScalingService.getInstance();
    jest.clearAllMocks();
  });

  describe('addUserToRoom', () => {
    it('should add user to room successfully', async () => {
      // Arrange
      const roomId = 'room-123';
      const userId = 'user-456';
      const username = 'testuser';

      (mockRedis.hset as jest.Mock).mockResolvedValue(1);
      (mockRedis.expire as jest.Mock).mockResolvedValue(1);

      // Act
      await scalingService.addUserToRoom(roomId, userId, username);

      // Assert
      expect(mockRedis.hset).toHaveBeenCalledWith(
        'room:room-123:users',
        'user-456',
        expect.stringContaining('testuser')
      );
      expect(mockRedis.expire).toHaveBeenCalledWith('room:room-123:users', 86400);
    });

    it('should reject invalid input parameters', async () => {
      // Arrange
      const invalidRoomId = '';
      const userId = 'user-456';
      const username = 'testuser';

      // Act & Assert
      await expect(
        scalingService.addUserToRoom(invalidRoomId, userId, username)
      ).rejects.toThrow('Invalid input parameters');

      expect(mockRedis.hset).not.toHaveBeenCalled();
    });

    it('should sanitize room ID and user ID', async () => {
      // Arrange
      const roomId = 'room@#$123';
      const userId = 'user!@#456';
      const username = 'testuser';

      (mockRedis.hset as jest.Mock).mockResolvedValue(1);
      (mockRedis.expire as jest.Mock).mockResolvedValue(1);

      // Act
      await scalingService.addUserToRoom(roomId, userId, username);

      // Assert
      expect(mockRedis.hset).toHaveBeenCalledWith(
        'room:room123:users',
        'user456',
        expect.any(String)
      );
    });
  });

  describe('removeUserFromRoom', () => {
    it('should remove user from room successfully', async () => {
      // Arrange
      const roomId = 'room-123';
      const userId = 'user-456';

      (mockRedis.hdel as jest.Mock).mockResolvedValue(1);

      // Act
      await scalingService.removeUserFromRoom(roomId, userId);

      // Assert
      expect(mockRedis.hdel).toHaveBeenCalledWith('room:room-123:users', 'user-456');
    });

    it('should reject invalid parameters', async () => {
      // Arrange
      const roomId = '';
      const userId = 'user-456';

      // Act & Assert
      await expect(
        scalingService.removeUserFromRoom(roomId, userId)
      ).rejects.toThrow('Invalid input parameters');
    });
  });

  describe('getRoomUsers', () => {
    it('should return list of users in room', async () => {
      // Arrange
      const roomId = 'room-123';
      const mockUsers = {
        'user-1': JSON.stringify({ userId: 'user-1', username: 'user1', connectedAt: new Date().toISOString() }),
        'user-2': JSON.stringify({ userId: 'user-2', username: 'user2', connectedAt: new Date().toISOString() }),
      };

      (mockRedis.hgetall as jest.Mock).mockResolvedValue(mockUsers);

      // Act
      const result = await scalingService.getRoomUsers(roomId);

      // Assert
      expect(mockRedis.hgetall).toHaveBeenCalledWith('room:room-123:users');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        userId: 'user-1',
        username: 'user1',
      }));
    });

    it('should handle invalid JSON gracefully', async () => {
      // Arrange
      const roomId = 'room-123';
      const mockUsers = {
        'user-1': 'invalid-json',
        'user-2': JSON.stringify({ userId: 'user-2', username: 'user2' }),
      };

      (mockRedis.hgetall as jest.Mock).mockResolvedValue(mockUsers);

      // Act
      const result = await scalingService.getRoomUsers(roomId);

      // Assert
      expect(result).toHaveLength(1); // Apenas o user-2 válido
      expect(result[0].userId).toBe('user-2');
    });

    it('should return empty array for invalid room ID', async () => {
      // Arrange
      const invalidRoomId = '';

      // Act
      const result = await scalingService.getRoomUsers(invalidRoomId);

      // Assert
      expect(result).toEqual([]);
      expect(mockRedis.hgetall).not.toHaveBeenCalled();
    });
  });

  describe('getUserRoomCount', () => {
    it('should return correct user count', async () => {
      // Arrange
      const roomId = 'room-123';
      (mockRedis.hlen as jest.Mock).mockResolvedValue(5);

      // Act
      const result = await scalingService.getUserRoomCount(roomId);

      // Assert
      expect(mockRedis.hlen).toHaveBeenCalledWith('room:room-123:users');
      expect(result).toBe(5);
    });

    it('should return 0 for invalid room ID', async () => {
      // Arrange
      const invalidRoomId = '';

      // Act
      const result = await scalingService.getUserRoomCount(invalidRoomId);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('addActiveViewer', () => {
    it('should add viewer to room', async () => {
      // Arrange
      const roomId = 'room-123';
      const userId = 'user-456';

      (mockRedis.sadd as jest.Mock).mockResolvedValue(1);
      (mockRedis.expire as jest.Mock).mockResolvedValue(1);

      // Act
      await scalingService.addActiveViewer(roomId, userId);

      // Assert
      expect(mockRedis.sadd).toHaveBeenCalledWith('room:room-123:viewers', 'user-456');
      expect(mockRedis.expire).toHaveBeenCalledWith('room:room-123:viewers', 3600);
    });
  });

  describe('isUserActiveViewer', () => {
    it('should return true if user is active viewer', async () => {
      // Arrange
      const roomId = 'room-123';
      const userId = 'user-456';

      (mockRedis.sismember as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await scalingService.isUserActiveViewer(roomId, userId);

      // Assert
      expect(mockRedis.sismember).toHaveBeenCalledWith('room:room-123:viewers', 'user-456');
      expect(result).toBe(true);
    });

    it('should return false if user is not active viewer', async () => {
      // Arrange
      const roomId = 'room-123';
      const userId = 'user-456';

      (mockRedis.sismember as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await scalingService.isUserActiveViewer(roomId, userId);

      // Assert
      expect(result).toBe(false);
    });
  });
}); 