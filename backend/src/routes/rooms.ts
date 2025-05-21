import { Router, Request, Response } from "express";
import prisma from "../../prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.post("/", async (req: Request, res: Response) => {
  const { name } = req.body;
  const room = await prisma.room.create({ data: { name } });
  res.status(201).json(room);
});

router.get("/", async (_req: Request, res: Response) => {
  const rooms = await prisma.room.findMany();
  res.json(rooms);
});

export default router;
