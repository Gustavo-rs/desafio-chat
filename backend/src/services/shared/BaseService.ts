import { PrismaClient } from '@prisma/client';
import { prisma } from '../../config/database';

export abstract class BaseService {
  protected readonly db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  protected validateId(id: string, fieldName: string = 'ID'): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error(`${fieldName} inválido`);
    }
  }

  protected logError(error: any, context: string): void {
    console.error(`[${context}] Erro:`, error);
  }

  protected formatResponse<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      message,
    };
  }
} 