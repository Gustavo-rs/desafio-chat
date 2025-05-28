import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const pubClient = new Redis(redisUrl);
export const subClient = pubClient.duplicate();
export const redisClient = new Redis(redisUrl);

export const redisAdapter = createAdapter(pubClient, subClient);

pubClient.on('error', (err) => {
  console.error('[Redis Pub Client] Connection error:', err.message);
});

subClient.on('error', (err) => {
  console.error('[Redis Sub Client] Connection error:', err.message);
});

redisClient.on('error', (err) => {
  console.error('[Redis Client] Connection error:', err.message);
});

pubClient.on('connect', () => {
  console.log('[Redis Pub Client] Connected successfully');
});

pubClient.on('ready', () => {
  console.log('[Redis Pub Client] Ready to accept commands');
});

pubClient.on('close', () => {
  console.log('[Redis Pub Client] Connection closed');
});

pubClient.on('reconnecting', () => {
  console.log('[Redis Pub Client] Reconnecting...');
});

subClient.on('connect', () => {
  console.log('[Redis Sub Client] Connected successfully');
});

subClient.on('ready', () => {
  console.log('[Redis Sub Client] Ready to accept commands');
});

subClient.on('close', () => {
  console.log('[Redis Sub Client] Connection closed');
});

subClient.on('reconnecting', () => {
  console.log('[Redis Sub Client] Reconnecting...');
});

redisClient.on('connect', () => {
  console.log('[Redis Client] Connected successfully');
});

redisClient.on('ready', () => {
  console.log('[Redis Client] Ready to accept commands');
});

redisClient.on('close', () => {
  console.log('[Redis Client] Connection closed');
});

redisClient.on('reconnecting', () => {
  console.log('[Redis Client] Reconnecting...');
});

process.on('SIGTERM', async () => {
  try {
    await Promise.all([
      pubClient.quit(),
      subClient.quit(),
      redisClient.quit()
    ]);
  } catch (error) {
    console.error('Error closing Redis connections:', error);
  }
});

export default redisClient;