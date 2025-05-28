import { describe, it, expect, vi, beforeEach } from 'vitest';
import MessageService from '../../services/message-service';

vi.mock('../../services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('MessageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basePath', () => {
    it('deve ter o caminho base correto', () => {
      expect(MessageService.basePath).toBe('/messages');
    });
  });

  describe('listMessagesFromRoom', () => {
    it('deve ser uma função', () => {
      expect(typeof MessageService.listMessagesFromRoom).toBe('function');
    });
  });

  describe('createMessage', () => {
    it('deve ser uma função', () => {
      expect(typeof MessageService.createMessage).toBe('function');
    });
  });

  describe('createMessageWithMultipleFiles', () => {
    it('deve ser uma função', () => {
      expect(typeof MessageService.createMessageWithMultipleFiles).toBe('function');
    });
  });

  describe('deleteMessage', () => {
    it('deve ser uma função', () => {
      expect(typeof MessageService.deleteMessage).toBe('function');
    });
  });

  describe('updateMessage', () => {
    it('deve ser uma função', () => {
      expect(typeof MessageService.updateMessage).toBe('function');
    });
  });
}); 