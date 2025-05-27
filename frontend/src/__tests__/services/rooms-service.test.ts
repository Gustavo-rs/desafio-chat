import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoomsService from '../../services/rooms-service';

// Mock simples do serviço
vi.mock('../../services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('RoomsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basePath', () => {
    it('deve ter o caminho base correto', () => {
      expect(RoomsService.basePath).toBe('/rooms');
    });
  });

  describe('create', () => {
    it('deve ser uma função', () => {
      expect(typeof RoomsService.create).toBe('function');
    });
  });

  describe('list', () => {
    it('deve ser uma função', () => {
      expect(typeof RoomsService.list).toBe('function');
    });
  });

  describe('get', () => {
    it('deve ser uma função', () => {
      expect(typeof RoomsService.get).toBe('function');
    });
  });

  describe('delete', () => {
    it('deve ser uma função', () => {
      expect(typeof RoomsService.delete).toBe('function');
    });
  });

  describe('getUnreadCounts', () => {
    it('deve ser uma função', () => {
      expect(typeof RoomsService.getUnreadCounts).toBe('function');
    });
  });

  describe('getRoomDetails', () => {
    it('deve ser uma função', () => {
      expect(typeof RoomsService.getRoomDetails).toBe('function');
    });
  });

  describe('getRoomParticipants', () => {
    it('deve ser uma função', () => {
      expect(typeof RoomsService.getRoomParticipants).toBe('function');
    });
  });

  describe('getRoomFiles', () => {
    it('deve ser uma função', () => {
      expect(typeof RoomsService.getRoomFiles).toBe('function');
    });
  });

  describe('addMemberToRoom', () => {
    it('deve ser uma função', () => {
      expect(typeof RoomsService.addMemberToRoom).toBe('function');
    });
  });

  describe('removeMemberFromRoom', () => {
    it('deve ser uma função', () => {
      expect(typeof RoomsService.removeMemberFromRoom).toBe('function');
    });
  });

  describe('getAvailableUsers', () => {
    it('deve ser uma função', () => {
      expect(typeof RoomsService.getAvailableUsers).toBe('function');
    });
  });

  describe('getAllUsers', () => {
    it('deve ser uma função', () => {
      expect(typeof RoomsService.getAllUsers).toBe('function');
    });
  });
}); 