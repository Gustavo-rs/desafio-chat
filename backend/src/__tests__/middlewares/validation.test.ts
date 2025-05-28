import { Request, Response, NextFunction } from 'express';
import { validate } from '../../middlewares/validation';
import { createUserSchema } from '../../schemas/validation';
import { AppError } from '../../utils/errors';

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('validate middleware', () => {
    it('should pass validation with valid data', async () => {
      // Arrange
      mockReq.body = {
        username: 'testuser',
        password: 'password123',
      };

      const middleware = validate(createUserSchema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject validation with missing username', async () => {
      // Arrange
      mockReq.body = {
        password: 'password123',
      };

      const middleware = validate(createUserSchema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('Nome de usuário é obrigatório');
      expect(error.statusCode).toBe(400);
    });

    it('should reject validation with short username', async () => {
      // Arrange
      mockReq.body = {
        username: 'ab', // muito curto
        password: 'password123',
      };

      const middleware = validate(createUserSchema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('Nome de usuário deve ter pelo menos 3 caracteres');
    });

    it('should reject validation with short password', async () => {
      // Arrange
      mockReq.body = {
        username: 'testuser',
        password: '123', // muito curto
      };

      const middleware = validate(createUserSchema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('Senha deve ter pelo menos 6 caracteres');
    });

    it('should reject validation with missing password', async () => {
      // Arrange
      mockReq.body = {
        username: 'testuser',
      };

      const middleware = validate(createUserSchema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('Senha é obrigatória');
    });
  });
}); 