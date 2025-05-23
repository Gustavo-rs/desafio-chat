import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types/express";
import { config } from "../config/config";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization;

  if (!token) {
    res.status(401).json({ message: "Token ausente" });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; username: string };
    const authReq = req as unknown as AuthenticatedRequest;
    authReq.user = {
      id: parseInt(decoded.userId),
      username: decoded.username
    };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token inválido" });
  }
};
