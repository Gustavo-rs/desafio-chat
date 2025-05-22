import { Router, Request, Response } from "express";
import prisma from "../../prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = "desafio";

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { name, password } = req.body;

  if (!name || !password) {
    res.status(400).json({ message: "Nome e senha são obrigatórios" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing) {
    res.status(400).json({ message: "Usuário já existe" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, password: hashedPassword },
  });

  res.status(201).json({ id: user.id, name: user.name, message: "Usuário criado com sucesso" });
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { name, password } = req.body;

  const user = await prisma.user.findUnique({ where: { name } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: "Credenciais inválidas" });
    return;
  }

  const token = jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET, {
    expiresIn: "2h",
  });

  res.json({ message: "Login realizado com sucesso",token, user: { id: user.id, name: user.name } });
});

export default router;
