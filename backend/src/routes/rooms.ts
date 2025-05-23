import { Router, Request, Response } from "express";
import { RequestHandler } from "express";
import prisma from "../../prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware";
import { io } from "../server";
import { AuthenticatedRequest } from "../types/express";

const router = Router();

router.use(authMiddleware);

router.post("/", (async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Nome da sala é obrigatório" });
  }

  const existingRoom = await prisma.room.findFirst({
    where: { name }
  });

  if (existingRoom) {
    return res.status(400).json({ message: "Já existe uma sala com este nome" });
  }

  const room = await prisma.room.create({ 
    data: { 
      name,
      id: undefined // Deixa o Prisma gerar o UUID automaticamente
    } 
  });
  
  io.emit("room_created", room);
  
  res.status(201).json(room);
}) as RequestHandler);

router.delete("/:id", (async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Primeiro verifica se a sala existe
    const existingRoom = await prisma.room.findUnique({
      where: { id }
    });

    if (!existingRoom) {
      return res.status(404).json({ message: "Sala não encontrada" });
    }

    // Deleta a sala
    await prisma.room.delete({
      where: { id }
    });

    io.emit("room_deleted", { id });

    res.json({ message: "Sala deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar sala:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
}) as RequestHandler);

router.get("/", (async (_req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const roomsWithLastMessage = rooms.map(room => ({
      ...room,
      lastMessage: room.messages[0] || null,
      messages: undefined
    }));

    res.json(roomsWithLastMessage);
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
}) as RequestHandler);

router.get("/unread-counts", (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;

    const unreadCounts = await prisma.unreadMessage.groupBy({
      by: ['roomId'],
      where: {
        userId: userId
      },
      _count: {
        _all: true
      }
    });

    const formattedCounts = unreadCounts.map(count => ({
      roomId: count.roomId,
      count: count._count._all
    }));

    res.json({ data: formattedCounts });
  } catch (error) {
    console.error("Erro ao buscar contagem de mensagens não lidas:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
}) as RequestHandler);

export default router;
