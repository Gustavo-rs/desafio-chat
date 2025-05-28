import { NotFoundError } from '../../utils/errors';
import { BaseService } from '../shared/BaseService';

export class UserRepositoryService extends BaseService {

  /**
   * Busca usuário por ID
   */
  async getUserById(id: string) {
    try {
      this.validateId(id, 'ID do usuário');

      const user = await this.db.user.findUnique({
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

    } catch (error) {
      this.logError(error, 'UserRepositoryService.getUserById');
      throw error;
    }
  }

  /**
   * Lista todos os usuários
   */
  async getUsers() {
    try {
      return await this.db.user.findMany({
        select: {
          id: true,
          username: true,
        },
      });

    } catch (error) {
      this.logError(error, 'UserRepositoryService.getUsers');
      throw error;
    }
  }

  /**
   * Busca usuário por username
   */
  async getUserByUsername(username: string) {
    try {
      if (!username || username.trim().length === 0) {
        throw new Error('Username é obrigatório');
      }

      return await this.db.user.findUnique({
        where: { username },
      });

    } catch (error) {
      this.logError(error, 'UserRepositoryService.getUserByUsername');
      throw error;
    }
  }

  /**
   * Verifica se usuário existe
   */
  async userExists(id: string): Promise<boolean> {
    try {
      this.validateId(id, 'ID do usuário');

      const user = await this.db.user.findUnique({
        where: { id },
        select: { id: true },
      });

      return !!user;

    } catch (error) {
      this.logError(error, 'UserRepositoryService.userExists');
      return false;
    }
  }
} 