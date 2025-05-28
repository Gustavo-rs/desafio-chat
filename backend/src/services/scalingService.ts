import { redisClient } from '../config/redis';
import { io } from '../server';

export class ScalingService {
  private static instance: ScalingService;
  
  public static getInstance(): ScalingService {
    if (!ScalingService.instance) {
      ScalingService.instance = new ScalingService();
    }
    return ScalingService.instance;
  }

  private validateInput(input: string): boolean {
    return typeof input === 'string' && input.length > 0 && input.length < 1000;
  }

  private sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9:_-]/g, '');
  }

  async addUserToRoom(roomId: string, userId: string, username: string): Promise<void> {
    try {
      if (!this.validateInput(roomId) || !this.validateInput(userId) || !this.validateInput(username)) {
        throw new Error('Invalid input parameters');
      }

      const key = `room:${this.sanitizeKey(roomId)}:users`;
      await redisClient.hset(key, this.sanitizeKey(userId), JSON.stringify({
        userId: this.sanitizeKey(userId),
        username: username.substring(0, 50),
        connectedAt: new Date().toISOString(),
        serverId: process.env.SERVER_ID || 'server-1'
      }));
      
      await redisClient.expire(key, 86400);
    } catch (error) {
      throw error;
    }
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    try {
      if (!this.validateInput(roomId) || !this.validateInput(userId)) {
        throw new Error('Invalid input parameters');
      }

      const key = `room:${this.sanitizeKey(roomId)}:users`;
      await redisClient.hdel(key, this.sanitizeKey(userId));
    } catch (error) {
      throw error;
    }
  }

  async getRoomUsers(roomId: string): Promise<any[]> {
    try {
      if (!this.validateInput(roomId)) {
        throw new Error('Invalid roomId parameter');
      }

      const key = `room:${this.sanitizeKey(roomId)}:users`;
      const users = await redisClient.hgetall(key);
      
      return Object.values(users).map(userStr => {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  async getUserRoomCount(roomId: string): Promise<number> {
    try {
      if (!this.validateInput(roomId)) {
        return 0;
      }

      const key = `room:${this.sanitizeKey(roomId)}:users`;
      return await redisClient.hlen(key);
    } catch (error) {
      return 0;
    }
  }

  async addActiveViewer(roomId: string, userId: string): Promise<void> {
    try {
      if (!this.validateInput(roomId) || !this.validateInput(userId)) {
        throw new Error('Invalid input parameters');
      }

      const key = `room:${this.sanitizeKey(roomId)}:viewers`;
      await redisClient.sadd(key, this.sanitizeKey(userId));
      await redisClient.expire(key, 3600);
    } catch (error) {
      throw error;
    }
  }

  async removeActiveViewer(roomId: string, userId: string): Promise<void> {
    try {
      if (!this.validateInput(roomId) || !this.validateInput(userId)) {
        throw new Error('Invalid input parameters');
      }

      const key = `room:${this.sanitizeKey(roomId)}:viewers`;
      await redisClient.srem(key, this.sanitizeKey(userId));
    } catch (error) {
      throw error;
    }
  }

  async getActiveViewers(roomId: string): Promise<string[]> {
    try {
      if (!this.validateInput(roomId)) {
        return [];
      }

      const key = `room:${this.sanitizeKey(roomId)}:viewers`;
      return await redisClient.smembers(key);
    } catch (error) {
      return [];
    }
  }

  async isUserActiveViewer(roomId: string, userId: string): Promise<boolean> {
    try {
      if (!this.validateInput(roomId) || !this.validateInput(userId)) {
        return false;
      }

      const key = `room:${this.sanitizeKey(roomId)}:viewers`;
      return (await redisClient.sismember(key, this.sanitizeKey(userId))) === 1;
    } catch (error) {
      return false;
    }
  }

  async setUserTyping(roomId: string, userId: string, username: string): Promise<void> {
    try {
      if (!this.validateInput(roomId) || !this.validateInput(userId) || !this.validateInput(username)) {
        throw new Error('Invalid input parameters');
      }

      const key = `room:${this.sanitizeKey(roomId)}:typing`;
      await redisClient.hset(key, this.sanitizeKey(userId), JSON.stringify({
        userId: this.sanitizeKey(userId),
        username: username.substring(0, 50),
        startedAt: new Date().toISOString(),
        serverId: process.env.SERVER_ID || 'server-1'
      }));
      
      await redisClient.expire(key, 10);
    } catch (error) {
      throw error;
    }
  }

  async removeUserTyping(roomId: string, userId: string): Promise<void> {
    try {
      if (!this.validateInput(roomId) || !this.validateInput(userId)) {
        throw new Error('Invalid input parameters');
      }

      const key = `room:${this.sanitizeKey(roomId)}:typing`;
      await redisClient.hdel(key, this.sanitizeKey(userId));
    } catch (error) {
      throw error;
    }
  }

  async getTypingUsers(roomId: string): Promise<any[]> {
    try {
      if (!this.validateInput(roomId)) {
        return [];
      }

      const key = `room:${this.sanitizeKey(roomId)}:typing`;
      const users = await redisClient.hgetall(key);
      
      return Object.values(users).map(userStr => {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      const typingKeys = await redisClient.keys('room:*:typing');
      const limitedKeys = typingKeys.slice(0, 100);
      
      for (const key of limitedKeys) {
        const users = await redisClient.hgetall(key);
        
        for (const [userId, userStr] of Object.entries(users)) {
          try {
            const userData = JSON.parse(userStr);
            const startedAt = new Date(userData.startedAt);
            
            if (startedAt < fiveMinutesAgo) {
              await redisClient.hdel(key, userId);
            }
          } catch {
            await redisClient.hdel(key, userId);
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async getSystemStats(): Promise<{
    totalRooms: number;
    totalUsers: number;
    totalActiveViewers: number;
    totalTypingUsers: number;
    serverLoad: any;
  }> {
    try {
      const cacheKey = 'system:stats';
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const roomKeys = await redisClient.keys('room:*:users');
      const viewerKeys = await redisClient.keys('room:*:viewers');
      const typingKeys = await redisClient.keys('room:*:typing');
      
      let totalUsers = 0;
      let totalActiveViewers = 0;
      let totalTypingUsers = 0;
      
      const pipeline = redisClient.pipeline();
      
      roomKeys.forEach(key => pipeline.hlen(key));
      viewerKeys.forEach(key => pipeline.scard(key));
      typingKeys.forEach(key => pipeline.hlen(key));
      
      const results = await pipeline.exec();
      
      if (results) {
        for (let i = 0; i < roomKeys.length; i++) {
          totalUsers += (results[i][1] as number) || 0;
        }
        
        for (let i = roomKeys.length; i < roomKeys.length + viewerKeys.length; i++) {
          totalActiveViewers += (results[i][1] as number) || 0;
        }
        
        for (let i = roomKeys.length + viewerKeys.length; i < results.length; i++) {
          totalTypingUsers += (results[i][1] as number) || 0;
        }
      }
      
      const stats = {
        totalRooms: roomKeys.length,
        totalUsers,
        totalActiveViewers,
        totalTypingUsers,
        serverLoad: {
          serverId: process.env.SERVER_ID || 'server-1',
          connectedSockets: io.engine.clientsCount,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        }
      };

      await redisClient.setex(cacheKey, 30, JSON.stringify(stats));
      
      return stats;
    } catch (error) {
      console.error('Error getting system stats:', error);
      return {
        totalRooms: 0,
        totalUsers: 0,
        totalActiveViewers: 0,
        totalTypingUsers: 0,
        serverLoad: {
          serverId: process.env.SERVER_ID || 'server-1',
          connectedSockets: 0,
          uptime: 0,
          memoryUsage: process.memoryUsage()
        }
      };
    }
  }

  async checkRateLimit(userId: string, action: string, limit: number, windowMs: number): Promise<boolean> {
    try {
      if (!this.validateInput(userId) || !this.validateInput(action)) {
        return false;
      }

      if (limit <= 0 || windowMs <= 0) {
        return false;
      }

      const key = `rate_limit:${this.sanitizeKey(userId)}:${this.sanitizeKey(action)}`;
      const current = await redisClient.incr(key);
      
      if (current === 1) {
        await redisClient.expire(key, Math.ceil(windowMs / 1000));
      }
      
      return current <= limit;
    } catch (error) {
      return false;
    }
  }

  async cacheRecentMessages(roomId: string, messages: any[]): Promise<void> {
    try {
      if (!this.validateInput(roomId) || !Array.isArray(messages)) {
        throw new Error('Invalid input parameters');
      }

      const key = `room:${this.sanitizeKey(roomId)}:recent_messages`;
      await redisClient.setex(key, 300, JSON.stringify(messages));
    } catch (error) {
      throw error;
    }
  }

  async getCachedMessages(roomId: string): Promise<any[] | null> {
    try {
      if (!this.validateInput(roomId)) {
        return null;
      }

      const key = `room:${this.sanitizeKey(roomId)}:recent_messages`;
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }
} 