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
import monitoringRoutes from "./routes/monitoring";
import { MessageService } from "./services/messageService";
import { redisAdapter } from "./config/redis";
import { ScalingService } from "./services/scalingService";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.BASE_URL_FRONTEND
].filter(Boolean);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
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

io.adapter(redisAdapter);

export { io };

const scalingService = ScalingService.getInstance();

const roomUsers = new Map<string, Map<string, {userId: string, username: string, socketId: string}>>();

const activeViewers = new Map<string, Set<string>>();

const updateRoomUsers = async (roomId: string) => {
  try {
    const roomSockets = await io.in(roomId).fetchSockets();
    const onlineUsers = roomSockets
      .filter(s => (s as any).user)
      .map(s => ({
        userId: (s as any).user.userId,
        username: (s as any).user.username,
        socketId: s.id
      }));

    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }
    
    const roomMap = roomUsers.get(roomId)!;
    roomMap.clear();
    
    onlineUsers.forEach(user => {
      roomMap.set(user.userId, user);
    });

    const usersList = Array.from(roomMap.values()).map(({userId, username}) => ({userId, username}));
    io.to(roomId).emit("room_users_updated", {
      roomId,
      users: usersList,
      count: usersList.length
    });
  } catch (error) {
    console.error('Error updating room users:', error);
  }
};

const removeUserFromAllRooms = async (socketId: string, userId: string) => {
  const roomsToUpdate = new Set<string>();
  
  for (const [roomId, usersMap] of roomUsers.entries()) {
    if (usersMap.has(userId)) {
      usersMap.delete(userId);
      roomsToUpdate.add(roomId);
    }
  }

  for (const [roomId, viewers] of activeViewers.entries()) {
    if (viewers.has(userId)) {
      viewers.delete(userId);
      if (viewers.size === 0) {
        activeViewers.delete(roomId);
      }
    }
  }

  for (const roomId of roomsToUpdate) {
    await updateRoomUsers(roomId);
  }
};

app.set('trust proxy', 1);

app.use(cookieParser());
app.use(express.json());
app.use(cors(corsOptions));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(rateLimit(config.rateLimit));

app.use("/rooms", authenticate, roomsRoutes);
app.use("/users", usersRoutes);
app.use("/messages", authenticate, messagesRoutes);
app.use("/monitoring", monitoringRoutes);

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
  socket.join(user.userId);

  socket.on("join_room", async (roomId) => {
    socket.join(roomId);
    await updateRoomUsers(roomId);
    socket.to(roomId).emit("user_joined_room", {
      userId: user.userId,
      username: user.username,
      roomId
    });
  });

  socket.on("leave_room", async (roomId) => {
    socket.leave(roomId);
    await updateRoomUsers(roomId);
    socket.to(roomId).emit("user_left_room", {
      userId: user.userId,
      username: user.username,
      roomId
    });
  });

  socket.on("start_viewing_room", async (roomId) => {
    if (!activeViewers.has(roomId)) {
      activeViewers.set(roomId, new Set());
    }
    activeViewers.get(roomId)!.add(user.userId);
    const messageService = new MessageService();
    await messageService.markMessagesAsRead(user.userId, roomId);
  });

  socket.on("stop_viewing_room", async (roomId) => {
    if (activeViewers.has(roomId)) {
      activeViewers.get(roomId)!.delete(user.userId);
      if (activeViewers.get(roomId)!.size === 0) {
        activeViewers.delete(roomId);
      }
    }
  });

  socket.on("send_message", async (data) => {
    try {
      const { content, roomId } = data;
      const messageService = new MessageService();
      await messageService.createMessage(content, roomId, user.userId);
    } catch (error) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("start_typing", (data) => {
    const { roomId } = data;
    socket.to(roomId).emit("user_start_typing", {
      roomId,
      userId: user.userId,
      username: user.username
    });
  });

  socket.on("stop_typing", (data) => {
    const { roomId } = data;
    socket.to(roomId).emit("user_stop_typing", {
      roomId,
      userId: user.userId,
      username: user.username
    });
  });

  socket.on("disconnecting", async () => {
    await removeUserFromAllRooms(socket.id, user.userId);
  });
});

app.use(errorHandler);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

export const getActiveViewers = (roomId: string): Set<string> => {
  return activeViewers.get(roomId) || new Set();
};
