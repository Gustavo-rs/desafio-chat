import { Router, Request, Response, NextFunction } from "express";
import { MessageService } from "../services/messageService";
import { validate } from "../middlewares/validation";
import { createMessageSchema } from "../schemas/validation";
import { MessageResponse, UnreadCountResponse, ErrorResponse } from "../models/message.model";
import { AppError } from "../utils/errors";
import { upload } from "../middlewares/upload";

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

router.post("/:roomId", upload.single('file'), validate(createMessageSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ message: "Você precisa estar logado para enviar mensagens" });
    }

    // Verifica se tem pelo menos conteúdo ou arquivo
    if (!content && !file) {
      return res.status(400).json({ message: "A mensagem deve conter texto ou um arquivo" });
    }

    const message = await messageService.createMessage(
      content || "", 
      userId, 
      roomId,
      file ? {
        fileName: file.originalname,
        fileUrl: `/${file.path.replace(/\\/g, '/')}`,
        fileType: file.mimetype,
        fileSize: file.size
      } : undefined
    );
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

router.delete("/:messageId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Você precisa estar logado para deletar mensagens" });
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
});

router.put("/:messageId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Você precisa estar logado para editar mensagens" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "O conteúdo da mensagem é obrigatório" });
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
});

export default router;
