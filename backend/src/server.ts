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

export { io };

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

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
  console.log(`🟢 Usuário conectado: ${socket.id} (${user.username})`);

  // Join user's personal room
  socket.join(user.userId.toString());
  console.log(`🔗 Socket ${socket.id} entrou na sala pessoal ${user.userId}`);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`🔗 Socket ${socket.id} entrou na sala ${roomId}`);
  });

  socket.on("send_message", async (data) => {
    console.log("📝 Nova mensagem recebida:", data);
    const { content, roomId } = data;
    const userId = user.userId;

    if (!content || !roomId || !userId) {
      console.log("❌ Dados inválidos na mensagem:", { content, roomId, userId });
      return;
    }

    try {
      console.log("💾 Salvando mensagem no banco...");
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
      console.log("✅ Mensagem salva:", newMessage);

      // Get all users except the sender
      console.log("👥 Buscando outros usuários...");
      const users = await prisma.user.findMany({
        where: {
          id: {
            not: userId
          }
        }
      });
      console.log("👥 Usuários encontrados:", users);

      // Create unread entries for all other users
      console.log("📌 Criando mensagens não lidas...");
      for (const user of users) {
        try {
          const unread = await prisma.unreadMessage.create({
            data: {
              messageId: newMessage.id,
              userId: user.id,
              roomId: Number(roomId)
            }
          });
          console.log(`✅ Mensagem não lida criada para usuário ${user.id}:`, unread);

          // Emitir evento de mensagem não lida para o socket do usuário
          io.to(user.id.toString()).emit("unread_message", {
            roomId: Number(roomId)
          });
          console.log(`📢 Notificação enviada para usuário ${user.id}`);
        } catch (error) {
          console.error(`❌ Erro ao criar mensagem não lida para usuário ${user.id}:`, error);
        }
      }

      // Emitir a mensagem para a sala
      io.to(roomId.toString()).emit("receive_message", newMessage);
      console.log("📢 Mensagem enviada para a sala:", roomId);

    } catch (err) {
      console.error("❌ Erro ao salvar mensagem:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Usuário desconectado: ${socket.id}`);
  });
});

server.listen(3001, () => {
  console.log("🚀 Servidor rodando na porta 3001");
});
