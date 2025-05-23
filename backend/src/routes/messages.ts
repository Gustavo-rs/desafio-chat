import { Router, Request, Response, NextFunction } from "express";
import { MessageService } from "../services/messageService";
import { validate } from "../middlewares/validation";
import { createMessageSchema } from "../schemas/validation";
import { MessageResponse, UnreadCountResponse, ErrorResponse } from "../models/message.model";
import { AppError } from "../utils/errors";

const router = Router();
const messageService = new MessageService();

router.get("/:roomId", async (req: Request, res: Response<MessageResponse | ErrorResponse>, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const { page = "1", limit = "20" } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Você precisa estar logado para ver as mensagens" });
    }

    const messages = await messageService.getMessages(roomId, userId, parseInt(page as string), parseInt(limit as string));
    res.json(messages);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Erro ao buscar mensagens", 500));
    }
  }
});

router.post("/:roomId", validate(createMessageSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Você precisa estar logado para enviar mensagens" });
    }

    const message = await messageService.createMessage(content, userId, roomId);
    res.status(201).json(message);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Erro ao enviar mensagem", 500));
    }
  }
});

router.get("/unread/count", async (req: Request, res: Response<UnreadCountResponse | ErrorResponse>, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Você precisa estar logado para ver mensagens não lidas" });
    }

    const unreadCounts = await messageService.getUnreadCounts(userId);
    res.json({ unreadCounts });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Erro ao buscar mensagens não lidas", 500));
    }
  }
});

export default router;
