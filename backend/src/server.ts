import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import roomsRoutes from "./routes/rooms";
import usersRoutes from "./routes/users";
import messagesRoutes from "./routes/messages";
import prisma from "../prisma/client";

const JWT_SECRET = "desafio";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());
app.use("/rooms", roomsRoutes);
app.use("/users", usersRoutes);
app.use("/messages", messagesRoutes);

app.get("/", (req, res) => {
  res.send("Servidor de chat online!");
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Token ausente"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (socket as any).user = decoded;
    next();
  } catch (err) {
    return next(new Error("Token inválido"));
  }
});

io.on("connection", (socket) => {
  const user = (socket as any).user;
  console.log(`🟢 Usuário conectado: ${socket.id} (${user.name})`);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`🔗 Socket ${socket.id} entrou na sala ${roomId}`);
  });

  socket.on("send_message", async (data) => {
    const { content, roomId } = data;
    const userId = user.userId;

    if (!content || !roomId || !userId) return;

    try {
      const newMessage = await prisma.message.create({
        data: {
          content,
          roomId,
          userId,
        },
        include: {
          user: true,
        },
      });

      io.to(roomId).emit("receive_message", newMessage);
    } catch (err) {
      console.error("Erro ao salvar mensagem:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Usuário desconectado: ${socket.id}`);
  });
});

server.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});
