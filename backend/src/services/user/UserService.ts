import { Response } from 'express';
import { AuthService } from './AuthService';
import { UserRepositoryService } from './UserRepositoryService';
import { BaseService } from '../shared/BaseService';

export class UserService extends BaseService {
  private authService: AuthService;
  private userRepository: UserRepositoryService;

  constructor() {
    super();
    this.authService = new AuthService();
    this.userRepository = new UserRepositoryService();
  }

  async createUser(username: string, password: string, res: Response) {
    return this.authService.register(username, password, res);
  }

  async login(username: string, password: string, res: Response) {
    return this.authService.login(username, password, res);
  }

  verifyToken(token: string) {
    return this.authService.verifyToken(token);
  }

  async getUserById(id: string) {
    return this.userRepository.getUserById(id);
  }

  async getUsers() {
    return this.userRepository.getUsers();
  }

  async getUserByUsername(username: string) {
    return this.userRepository.getUserByUsername(username);
  }

  async userExists(id: string): Promise<boolean> {
    return this.userRepository.userExists(id);
  }
} 