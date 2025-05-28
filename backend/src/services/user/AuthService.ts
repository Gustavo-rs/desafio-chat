import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { config } from '../../config/config';
import { AppError } from '../../utils/errors';
import { BaseService } from '../shared/BaseService';

export class AuthService extends BaseService {
  
  /**
   * Define cookie de autenticação
   */
  private setAuthCookie(res: Response, userId: string, username: string): string {
    const token = jwt.sign({ userId, username }, config.jwtSecret!, { 
      expiresIn: "24h" 
    });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });
    
    return token;
  }

  /**
   * Registra um novo usuário
   */
  async register(username: string, password: string, res: Response) {
    try {
      this.validateCredentials(username, password);

      const existingUser = await this.db.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        throw new AppError("Nome de usuário já existe", 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.db.user.create({
        data: {
          username,
          password: hashedPassword,
        },
      });

      const token = this.setAuthCookie(res, user.id, user.username);
      return { user, token };

    } catch (error) {
      this.logError(error, 'AuthService.register');
      throw error;
    }
  }

  /**
   * Faz login do usuário
   */
  async login(username: string, password: string, res: Response) {
    try {
      this.validateCredentials(username, password);

      const user = await this.db.user.findUnique({
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

    } catch (error) {
      this.logError(error, 'AuthService.login');
      throw error;
    }
  }

  /**
   * Verifica token JWT
   */
  verifyToken(token: string) {
    try {
      return jwt.verify(token, config.jwtSecret!) as any;
    } catch (error) {
      throw new AppError("Token inválido", 401);
    }
  }

  /**
   * Valida credenciais básicas
   */
  private validateCredentials(username: string, password: string): void {
    if (!username || username.trim().length === 0) {
      throw new AppError("Nome de usuário é obrigatório", 400);
    }
    
    if (!password || password.length < 6) {
      throw new AppError("Senha deve ter pelo menos 6 caracteres", 400);
    }
  }
} 