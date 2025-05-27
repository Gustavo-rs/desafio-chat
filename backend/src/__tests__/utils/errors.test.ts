import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../../utils/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('deve criar erro com statusCode numérico', () => {
      const message = 'Test error';
      const statusCode = 500;

      const error = new AppError(message, statusCode);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('deve criar erro com statusCode string', () => {
      const message = 'Test error';
      const statusCode = '400';

      const error = new AppError(message, statusCode);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('deve ter stack trace adequado', () => {
      const error = new AppError('Test error', 500);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Error');
      expect(error.constructor.name).toBe('AppError');
    });
  });

  describe('ValidationError', () => {
    it('deve criar erro de validação com statusCode 400', () => {
      const message = 'Validation failed';

      const error = new ValidationError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('AuthenticationError', () => {
    it('deve criar erro de autenticação com statusCode 401', () => {
      const message = 'Authentication failed';

      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('deve usar mensagem padrão quando não fornecida', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Falha na autenticação');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('AuthorizationError', () => {
    it('deve criar erro de autorização com statusCode 403', () => {
      const message = 'Authorization failed';

      const error = new AuthorizationError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(403);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(AuthorizationError);
    });

    it('deve usar mensagem padrão quando não fornecida', () => {
      const error = new AuthorizationError();

      expect(error.message).toBe('Não autorizado');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('deve criar erro de not found com statusCode 404', () => {
      const message = 'Resource not found';

      const error = new NotFoundError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('deve usar mensagem padrão quando não fornecida', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Recurso não encontrado');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('deve criar erro de conflito com statusCode 409', () => {
      const message = 'Resource already exists';

      const error = new ConflictError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(409);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ConflictError);
    });

    it('deve usar mensagem padrão quando não fornecida', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Recurso já existe');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('ForbiddenError', () => {
    it('deve criar erro de forbidden com statusCode 403', () => {
      const message = 'Access denied';

      const error = new ForbiddenError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(403);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ForbiddenError);
    });

    it('deve usar mensagem padrão quando não fornecida', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Acesso negado');
      expect(error.statusCode).toBe(403);
    });
  });
}); 