import { PrismaClient } from '@prisma/client';

class DatabaseService {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient();
    }
    return DatabaseService.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseService.instance) {
      await DatabaseService.instance.$disconnect();
    }
  }
}

export const prisma = DatabaseService.getInstance();
export default DatabaseService; 