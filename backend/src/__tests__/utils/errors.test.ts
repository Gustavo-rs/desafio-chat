import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../../utils/errors';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Test error', 400);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should handle string status code', () => {
      const error = new AppError('Test error', '404');
      
      expect(error.statusCode).toBe(404);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 500);
      
      expect(error.stack).toBeDefined();
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with 400 status', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with 401 status', () => {
      const error = new AuthenticationError('Invalid credentials');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });

    it('should use default message when none provided', () => {
      const error = new AuthenticationError();
      
      expect(error.message).toBe('Falha na autenticação');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error with 403 status', () => {
      const error = new AuthorizationError('Access denied');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
    });

    it('should use default message when none provided', () => {
      const error = new AuthorizationError();
      
      expect(error.message).toBe('Não autorizado');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with 404 status', () => {
      const error = new NotFoundError('Resource not found');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should use default message when none provided', () => {
      const error = new NotFoundError();
      
      expect(error.message).toBe('Recurso não encontrado');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with 409 status', () => {
      const error = new ConflictError('Resource already exists');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
    });

    it('should use default message when none provided', () => {
      const error = new ConflictError();
      
      expect(error.message).toBe('Recurso já existe');
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error with 403 status', () => {
      const error = new ForbiddenError('Access forbidden');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Access forbidden');
      expect(error.statusCode).toBe(403);
    });

    it('should use default message when none provided', () => {
      const error = new ForbiddenError();
      
      expect(error.message).toBe('Acesso negado');
    });
  });
}); 