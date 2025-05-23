import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
  };
} 