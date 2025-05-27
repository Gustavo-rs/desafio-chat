import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { ConflictError, NotFoundError, AuthenticationError, AppError } from '../utils/errors';
import { Response } from 'express';

const prisma = new PrismaClient();

export class UserService {
  private setAuthCookie(res: Response, userId: string, username: string) {
    const token = jwt.sign({ userId, username }, config.jwtSecret!, { expiresIn: "24h" });
    
    // Configuração específica para produção cross-origin (Vercel + Railway)
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction, // HTTPS obrigatório em produção
      sameSite: isProduction ? 'none' : 'lax', // 'none' permite cross-origin em produção
      domain: isProduction ? undefined : undefined, // Sem domain específico para permitir cross-origin
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/' // Garantir que o cookie funciona em todas as rotas
    });
    return token;
  }

  async createUser(username: string, password: string, res: Response) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new AppError("Nome de usuário já existe", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    const token = this.setAuthCookie(res, user.id, user.username);
    return { user, token };
  }

  async login(username: string, password: string, res: Response) {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new AppError("Nome de usuário ou senha inválidos", 401);
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      throw new AppError("Nome de usuário ou senha inválidos", 401);
    }

    const token = this.setAuthCookie(res, user.id, user.username);
    return { user, token };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    return user;
  }

  async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
      },
    });
  }
} 