import { Router, Request, Response } from "express";
import { RequestHandler } from "express";
import prisma from "../../prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware";
import { io } from "../server";
import { AuthenticatedRequest } from "../types/express";

const router = Router();

router.use(authMiddleware);

router.get("/:roomId", (async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Usuário não autenticado" });
    return;
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    await prisma.unreadMessage.deleteMany({
      where: {
        roomId,
        userId
      }
    });

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { roomId },
        include: {
          user: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip
      }),
      prisma.message.count({
        where: { roomId }
      })
    ]);

    console.log("Mensagens encontradas:", messages.length);
    console.log("Total de mensagens:", total);

    io.to(String(userId)).emit("messages_read", {
      roomId
    });

    res.json({
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      limit,
      messages: messages.reverse(),
    });
  } catch (error) {
    console.error("Erro detalhado ao buscar mensagens:", error);
    if (error instanceof Error) {
      console.error("Mensagem de erro:", error.message);
      console.error("Stack trace:", error.stack);
    }
    res.status(500).json({ error: "Erro ao buscar mensagens", details: error instanceof Error ? error.message : "Erro desconhecido" });
  }
}) as RequestHandler);

export default router;
