import { Router, Request, Response } from "express";
import prisma from "../../prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = "desafio";

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: "Nome e senha são obrigatórios" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { username: username } });
  if (existing) {
    res.status(400).json({ message: "Usuário já existe" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username: username, password: hashedPassword },
  });

  res.status(201).json({ id: user.id, username: user.username, message: "Usuário criado com sucesso" });
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: "Usuário e senha são obrigatórios" });
    return;
  }

  try {
    // 🔍 Buscar usuário pelo username
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Credenciais inválidas" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login realizado com sucesso",
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });

  } catch (error) {
    console.error("Erro ao tentar login:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

export default router;
