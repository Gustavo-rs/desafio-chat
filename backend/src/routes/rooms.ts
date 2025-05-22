import { Router, Request, Response } from "express";
import { RequestHandler } from "express";
import prisma from "../../prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware";

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

  const room = await prisma.room.create({ data: { name } });
  res.status(201).json(room);
}) as RequestHandler);

router.get("/", (async (_req: Request, res: Response) => {
  const rooms = await prisma.room.findMany();
  res.json(rooms);
}) as RequestHandler);

export default router;
