import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '../../services/auth-service';

// Mock simples do serviço
vi.mock('../../services/http', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basePath', () => {
    it('deve ter o caminho base correto', () => {
      expect(AuthService.basePath).toBe('/users');
    });
  });

  describe('register', () => {
    it('deve ser uma função', () => {
      expect(typeof AuthService.register).toBe('function');
    });
  });

  describe('auth (login)', () => {
    it('deve ser uma função', () => {
      expect(typeof AuthService.auth).toBe('function');
    });
  });

  describe('verify', () => {
    it('deve ser uma função', () => {
      expect(typeof AuthService.verify).toBe('function');
    });
  });

  describe('logout', () => {
    it('deve ser uma função', () => {
      expect(typeof AuthService.logout).toBe('function');
    });
  });
}); 