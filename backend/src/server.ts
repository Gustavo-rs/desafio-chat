import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { config } from "./config/config";
import { errorHandler } from "./middlewares/errorHandler";
import { authenticate } from "./middlewares/auth";
import roomsRoutes from "./routes/rooms";
import usersRoutes from "./routes/users";
import messagesRoutes from "./routes/messages";
import { MessageService } from "./services/messageService";

const app = express();
const server = http.createServer(app);

// Configure CORS
const allowedOrigins = [
  process.env.BASE_URL_FRONTEND
].filter(Boolean);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(server, {
  cors: corsOptions
});

export { io };

// Mapa para rastrear usuários online por sala
const roomUsers = new Map<string, Map<string, {userId: string, username: string, socketId: string}>>();

// Mapa para rastrear usuários que estão atualmente visualizando cada sala
const activeViewers = new Map<string, Set<string>>(); // roomId -> Set<userId>

// Função para atualizar lista de usuários online de uma sala
const updateRoomUsers = async (roomId: string) => {
  try {
    const roomSockets = await io.in(roomId).fetchSockets();
    const onlineUsers = roomSockets
      .filter(s => (s as any).user) // Garantir que tem user
      .map(s => ({
        userId: (s as any).user.userId,
        username: (s as any).user.username,
        socketId: s.id
      }));

    // Atualizar mapa interno
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }
    
    const roomMap = roomUsers.get(roomId)!;
    roomMap.clear();
    
    onlineUsers.forEach(user => {
      roomMap.set(user.userId, user);
    });

    // Emitir para todos na sala
    const usersList = Array.from(roomMap.values()).map(({userId, username}) => ({userId, username}));
    io.to(roomId).emit("room_users_updated", {
      roomId,
      users: usersList,
      count: usersList.length
    });

    console.log(`📊 Room ${roomId} users updated: ${usersList.map(u => u.username).join(', ')}`);
  } catch (error) {
    console.error('Error updating room users:', error);
  }
};

// Função para remover usuário de todas as salas
const removeUserFromAllRooms = async (socketId: string, userId: string) => {
  const roomsToUpdate = new Set<string>();
  
  // Encontrar todas as salas onde o usuário estava
  for (const [roomId, usersMap] of roomUsers.entries()) {
    if (usersMap.has(userId)) {
      usersMap.delete(userId);
      roomsToUpdate.add(roomId);
    }
  }

  // Remover usuário dos visualizadores ativos
  for (const [roomId, viewers] of activeViewers.entries()) {
    if (viewers.has(userId)) {
      viewers.delete(userId);
      if (viewers.size === 0) {
        activeViewers.delete(roomId);
      }
    }
  }

  // Atualizar todas as salas afetadas
  for (const roomId of roomsToUpdate) {
    await updateRoomUsers(roomId);
  }
};

// Trust proxy for Railway/Heroku/etc
app.set('trust proxy', 1);

app.use(cookieParser());
app.use(express.json());
app.use(cors(corsOptions));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(rateLimit(config.rateLimit));

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

app.use("/rooms", authenticate, roomsRoutes);
app.use("/users", usersRoutes);
app.use("/messages", authenticate, messagesRoutes);

app.get("/", (req, res) => {
  res.send("Chat server is running!");
});

io.use((socket, next) => {
  const token = socket.handshake.headers.cookie?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];

  if (!token) {
    return next(new Error("No token provided"));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret!) as unknown as { userId: string; username: string };
    (socket as any).user = decoded;
    next();
  } catch (err) {
    return next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const user = (socket as any).user;
  console.log(`🟢 User connected: ${socket.id} (${user.username})`);

  socket.join(user.userId);
  console.log(`🔗 Socket ${socket.id} joined personal room ${user.userId}`);

  socket.on("join_room", async (roomId) => {
    socket.join(roomId);
    console.log(`🔗 Socket ${socket.id} (${user.username}) joined room ${roomId}`);

    // Atualizar lista de usuários da sala
    await updateRoomUsers(roomId);
    
    // Notificar outros usuários sobre entrada
    socket.to(roomId).emit("user_joined_room", {
      userId: user.userId,
      username: user.username,
      roomId
    });
  });

  socket.on("leave_room", async (roomId) => {
    socket.leave(roomId);
    console.log(`🔗 Socket ${socket.id} (${user.username}) left room ${roomId}`);

    // Atualizar lista de usuários da sala
    await updateRoomUsers(roomId);
    
    // Notificar outros usuários sobre saída
    socket.to(roomId).emit("user_left_room", {
      userId: user.userId,
      username: user.username,
      roomId
    });
  });

  // Evento para quando usuário começa a visualizar uma sala (aba ativa)
  socket.on("start_viewing_room", async (roomId) => {
    if (!activeViewers.has(roomId)) {
      activeViewers.set(roomId, new Set());
    }
    activeViewers.get(roomId)!.add(user.userId);
    console.log(`👁️ User ${user.username} started viewing room ${roomId}`);
    
    // Marcar mensagens como lidas quando começar a visualizar
    const messageService = new MessageService();
    await messageService.markMessagesAsRead(user.userId, roomId);
  });

  // Evento para quando usuário para de visualizar uma sala (aba inativa ou mudou de sala)
  socket.on("stop_viewing_room", async (roomId) => {
    if (activeViewers.has(roomId)) {
      activeViewers.get(roomId)!.delete(user.userId);
      if (activeViewers.get(roomId)!.size === 0) {
        activeViewers.delete(roomId);
      }
    }
    console.log(`👁️ User ${user.username} stopped viewing room ${roomId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const { content, roomId } = data;
      const messageService = new MessageService();
      await messageService.createMessage(content, roomId, user.userId);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Eventos de typing indicators
  socket.on("start_typing", (data) => {
    const { roomId } = data;
    console.log(`⌨️ User ${user.username} started typing in room ${roomId}`);
    
    // Notificar outros usuários na sala que este usuário começou a digitar
    socket.to(roomId).emit("user_start_typing", {
      roomId,
      userId: user.userId,
      username: user.username
    });
  });

  socket.on("stop_typing", (data) => {
    const { roomId } = data;
    console.log(`⌨️ User ${user.username} stopped typing in room ${roomId}`);
    
    // Notificar outros usuários na sala que este usuário parou de digitar
    socket.to(roomId).emit("user_stop_typing", {
      roomId,
      userId: user.userId,
      username: user.username
    });
  });

  socket.on("disconnecting", async () => {
    console.log(`🔴 User disconnecting: ${socket.id} (${user.username})`);
    
    // Remover usuário de todas as salas antes da desconexão
    await removeUserFromAllRooms(socket.id, user.userId);
  });

  socket.on("disconnect", () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
  });
});

app.use(errorHandler);

server.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Database: ${config.database.url ? 'Connected' : 'Not configured'}`);
  console.log(`🌐 CORS Origins: ${JSON.stringify(allowedOrigins)}`);
});

// Função para obter visualizadores ativos de uma sala
export const getActiveViewers = (roomId: string): Set<string> => {
  return activeViewers.get(roomId) || new Set();
};
