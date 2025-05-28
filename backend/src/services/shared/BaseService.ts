import { PrismaClient } from '@prisma/client';
import { prisma } from '../../config/database';

export abstract class BaseService {
  protected readonly db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  /**
   * Validação genérica de ID
   */
  protected validateId(id: string, fieldName: string = 'ID'): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error(`${fieldName} inválido`);
    }
  }

  /**
   * Logging padronizado de erros
   */
  protected logError(error: any, context: string): void {
    console.error(`[${context}] Erro:`, error);
  }

  /**
   * Formatação de response padrão
   */
  protected formatResponse<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      message,
    };
  }
} 