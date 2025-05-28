import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { MessageService } from "../services/messageService";
import { validate } from "../middlewares/validation";
import { createMessageSchema } from "../schemas/validation";
import { MessageResponse, UnreadCountResponse, ErrorResponse } from "../models/message.model";
import { AppError } from "../utils/errors";
import { uploadMultiple } from "../middlewares/upload";

const router = Router();
const messageService = new MessageService();

const getMessages: RequestHandler<
  { roomId: string },
  MessageResponse | ErrorResponse,
  {},
  { page?: string; limit?: string }
> = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { page = "1", limit = "20" } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Você precisa estar logado para ver as mensagens" });
      return;
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
};

const createMessage: RequestHandler<
  { roomId: string },
  any | ErrorResponse,
  { content?: string },
  {}
> = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;
    const files = req.files as Express.Multer.File[];

    if (!userId) {
      res.status(401).json({ message: "Você precisa estar logado para enviar mensagens" });
      return;
    }

    if (!content && (!files || files.length === 0)) {
      res.status(400).json({ message: "A mensagem deve conter texto ou pelo menos um arquivo" });
      return;
    }

    const fileInfos = files?.map(file => ({
      fileName: file.originalname,
      fileUrl: `/uploads/${file.path.replace(/\\/g, '/').replace('uploads/', '')}`,
      fileType: file.mimetype,
      fileSize: file.size
    }));

    const message = await messageService.createMessage(
      content || "", 
      userId, 
      roomId,
      fileInfos
    );
    res.status(201).json(message);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Erro ao enviar mensagem", 500));
    }
  }
};

const getUnreadCount: RequestHandler<
  {},
  UnreadCountResponse | ErrorResponse,
  {},
  {}
> = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Você precisa estar logado para ver mensagens não lidas" });
      return;
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
};

const deleteMessage: RequestHandler<
  { messageId: string },
  { message: string } | ErrorResponse,
  {},
  {}
> = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Você precisa estar logado para deletar mensagens" });
      return;
    }

    await messageService.deleteMessage(messageId, userId);
    res.status(200).json({ message: "Mensagem deletada com sucesso" });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Erro ao deletar mensagem", 500));
    }
  }
};

const updateMessage: RequestHandler<
  { messageId: string },
  { message: string } | ErrorResponse,
  { content: string },
  {}
> = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Você precisa estar logado para editar mensagens" });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({ message: "O conteúdo da mensagem é obrigatório" });
      return;
    }

    await messageService.updateMessage(messageId, content, userId);
    res.status(200).json({ message: "Mensagem editada com sucesso" });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Erro ao editar mensagem", 500));
    }
  }
};

router.get("/unread/count", getUnreadCount);
router.get("/:roomId", getMessages);
router.post("/:roomId", uploadMultiple, validate(createMessageSchema), createMessage);
router.delete("/:messageId", deleteMessage);
router.put("/:messageId", updateMessage);

export default router;
