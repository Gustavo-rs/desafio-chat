import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/errors';

type ErrorMessageType = {
  required: string;
  minLength: string;
  maxLength?: string;
};

// Mapeamento de mensagens de erro em português
const errorMessages: Record<string, ErrorMessageType> = {
  username: {
    required: 'Nome de usuário é obrigatório',
    minLength: 'Nome de usuário deve ter pelo menos 3 caracteres',
    maxLength: 'Nome de usuário deve ter no máximo 50 caracteres'
  },
  password: {
    required: 'Senha é obrigatória',
    minLength: 'Senha deve ter pelo menos 6 caracteres'
  },
  content: {
    required: 'Mensagem é obrigatória',
    minLength: 'Mensagem deve ter pelo menos 1 caractere'
  }
};

// Função para obter mensagem de erro traduzida
const getTranslatedErrorMessage = (field: string, message: string): string => {
  const fieldMessages = errorMessages[field];
  
  if (!fieldMessages) {
    return message === 'Required' ? `${field} é obrigatório` : message;
  }

  if (message === 'Required') return fieldMessages.required;
  if (message.includes('at least')) return fieldMessages.minLength;
  if (message.includes('at most') && fieldMessages.maxLength) return fieldMessages.maxLength;

  return message;
};

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        const field = String(firstError.path[firstError.path.length - 1]);
        const message = getTranslatedErrorMessage(field, firstError.message);
        next(new AppError(message, 400));
      } else {
        next(error);
      }
    }
  };
}; 