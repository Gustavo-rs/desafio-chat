import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
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
const corsOptions = {
  origin: "http://localhost:5173", // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(server, {
  cors: corsOptions
});

export { io };

app.use(cookieParser());
app.use(express.json());
app.use(cors(corsOptions));

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
    console.log(`🔗 Socket ${socket.id} joined room ${roomId}`);

    const roomSockets = await io.in(roomId).fetchSockets();
    const onlineUsers = roomSockets.map(s => ({
      userId: (s as any).user.userId,
      username: (s as any).user.username
    }));

    io.to(roomId).emit("online_users", onlineUsers);
  });

  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
    console.log(`🔗 Socket ${socket.id} left room ${roomId}`);
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

  socket.on("disconnect", () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
  });
});

app.use(errorHandler);

server.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
});
