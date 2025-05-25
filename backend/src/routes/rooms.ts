import { Router, Request, Response, NextFunction } from "express";
import { RoomService } from "../services/roomService";
import { MessageService } from "../services/messageService";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { createRoomSchema, roomIdSchema } from "../schemas/validation";
import { PrismaClient } from '@prisma/client';

const router = Router();
const roomService = new RoomService();
const messageService = new MessageService();
const prisma = new PrismaClient();

router.use(authenticate);

router.post("/", validate(createRoomSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const userId = req.user!.userId;
    const room = await roomService.createRoom(name, userId);
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", validate(roomIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    await roomService.deleteRoom(id, userId);
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const rooms = await roomService.getRooms(userId);
    res.json(rooms);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/details", validate(roomIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const roomDetails = await roomService.getRoomDetails(id, userId);
    res.json(roomDetails);
  } catch (error) {
    next(error);
  }
});

// Adicionar membro à sala
router.post("/:id/members", validate(roomIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userIdToAdd } = req.body;
    const adminUserId = req.user!.userId;
    const member = await roomService.addMemberToRoom(id, userIdToAdd, adminUserId);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
});

// Remover membro da sala
router.delete("/:id/members/:userId", validate(roomIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, userId } = req.params;
    const adminUserId = req.user!.userId;
    const result = await roomService.removeMemberFromRoom(id, userId, adminUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Buscar usuários disponíveis para adicionar à sala
router.get("/:id/available-users", validate(roomIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user!.userId;
    const users = await roomService.getAvailableUsers(id, adminUserId);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Endpoint para buscar todos os usuários (para debug/teste)
router.get("/:id/all-users", validate(roomIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user!.userId;
    
    // Verificar se o usuário é ADMIN da sala
    const room = await roomService.getRoomById(id, adminUserId);
    
    // Buscar todos os usuários do sistema
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
      },
    });
    
    res.json(allUsers);
  } catch (error) {
    next(error);
  }
});

router.get("/unread-counts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const unreadCounts = await messageService.getUnreadCounts(userId);
    res.json({ data: unreadCounts });
  } catch (error) {
    next(error);
  }
});

export default router;
