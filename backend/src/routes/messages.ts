import { Router, Request, Response } from "express";
import prisma from "../../prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { content, roomId } = req.body;
  const user = (req as any).user;

  if (!content || !roomId) {
    res.status(400).json({ error: "Conteúdo e sala são obrigatórios" });
    return;
  }

  const message = await prisma.message.create({
    data: {
      content,
      roomId,
      userId: user.userId,
    },
  });

  res.status(201).json(message);
});

router.get("/:roomId", async (req: Request, res: Response): Promise<void> => {
  const { roomId } = req.params;

  const messages = await prisma.message.findMany({
    where: { roomId: Number(roomId) },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  res.json(messages);
});

export default router;
