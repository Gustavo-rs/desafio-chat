import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  commandTimeout: 5000,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  ...(process.env.REDIS_TLS === 'true' && {
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  })
};

export const pubClient = new Redis(redisConfig);
export const subClient = pubClient.duplicate();
export const redisAdapter = createAdapter(pubClient, subClient);
export const redisClient = new Redis(redisConfig);

pubClient.on('error', (err: any) => {
  console.error('Redis Pub Client Error:', err.message);
});

subClient.on('error', (err: any) => {
  console.error('Redis Sub Client Error:', err.message);
});

redisClient.on('error', (err: any) => {
  console.error('Redis Client Error:', err.message);
});

process.on('SIGTERM', async () => {
  await Promise.all([
    pubClient.quit(),
    subClient.quit(),
    redisClient.quit()
  ]);
});

export default redisClient;