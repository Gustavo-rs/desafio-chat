import { PrismaClient } from '@prisma/client';

// Mock Prisma Client for tests
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  room: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  roomMember: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  messageFile: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock do PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock do Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    hset: jest.fn(),
    hget: jest.fn(),
    hgetall: jest.fn(),
    hdel: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    sismember: jest.fn(),
    expire: jest.fn(),
    keys: jest.fn(),
    pipeline: jest.fn(() => ({
      exec: jest.fn(),
    })),
    duplicate: jest.fn(),
    on: jest.fn(),
    quit: jest.fn(),
  }));
});

// Mock do JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  JsonWebTokenError: class extends Error {},
}));

// Mock do bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Silenciar logs durante os testes
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  // Silenciar console.error e console.log durante os testes
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  // Restaurar console original após os testes
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// Configuração global para testes
beforeEach(() => {
  jest.clearAllMocks();
});

export { mockPrisma }; 