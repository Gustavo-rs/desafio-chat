import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types/express";

const JWT_SECRET = "desafio";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization;

  if (!token) {
    res.status(401).json({ error: "Token ausente" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
    (req as AuthenticatedRequest).user = {
      id: decoded.userId,
      username: decoded.username
    };
    next();
  } catch (err) {
    res.status(401).json({ error: "Token inválido" });
  }
};
