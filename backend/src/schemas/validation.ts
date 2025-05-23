import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string(),
    password: z.string(),
  }),
});

export const createRoomSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(50),
  }),
});

export const createMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(1000),
    roomId: z.string().uuid(),
  }),
});

export const roomIdSchema = z.object({
  params: z.object({
    roomId: z.string().uuid(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
}); 