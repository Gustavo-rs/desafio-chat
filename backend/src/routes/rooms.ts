import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { RoomService } from "../services/roomService";
import { MessageService } from "../services/messageService";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { createRoomSchema, roomIdSchema } from "../schemas/validation";
import { PrismaClient } from '@prisma/client';
import { Room, RoomResponse } from "../models/room.model";
import { UnreadCountResponse, ErrorResponse } from "../models/message.model";

const router = Router();
const roomService = new RoomService();
const messageService = new MessageService();
const prisma = new PrismaClient();

router.use(authenticate);

const createRoom: RequestHandler<
  {},
  any | ErrorResponse,
  { name: string },
  {}
> = async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user!.userId;
    const room = await roomService.createRoom(name, userId);
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
};

const deleteRoom: RequestHandler<
  { id: string },
  { message: string } | ErrorResponse,
  {},
  {}
> = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    await roomService.deleteRoom(id, userId);
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getRooms: RequestHandler<
  {},
  any[] | ErrorResponse,
  {},
  {}
> = async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const rooms = await roomService.getRooms(userId);
    res.json(rooms);
  } catch (error) {
    next(error);
  }
};

const getRoomDetails: RequestHandler<
  { id: string },
  any | ErrorResponse,
  {},
  {}
> = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const roomDetails = await roomService.getRoomDetails(id, userId);
    res.json(roomDetails);
  } catch (error) {
    next(error);
  }
};

const addMemberToRoom: RequestHandler<
  { id: string },
  any | ErrorResponse,
  { userIdToAdd: string },
  {}
> = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userIdToAdd } = req.body;
    const adminUserId = req.user!.userId;
    const member = await roomService.addMemberToRoom(id, userIdToAdd, adminUserId);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
};

const removeMemberFromRoom: RequestHandler<
  { id: string; userId: string },
  any | ErrorResponse,
  {},
  {}
> = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const adminUserId = req.user!.userId;
    const result = await roomService.removeMemberFromRoom(id, userId, adminUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getAvailableUsers: RequestHandler<
  { id: string },
  any[] | ErrorResponse,
  {},
  {}
> = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user!.userId;
    const users = await roomService.getAvailableUsers(id, adminUserId);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const getAllUsers: RequestHandler<
  { id: string },
  any[] | ErrorResponse,
  {},
  {}
> = async (req, res, next) => {
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
};

const getUnreadCounts: RequestHandler<
  {},
  { data: any[] } | ErrorResponse,
  {},
  {}
> = async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const unreadCounts = await messageService.getUnreadCounts(userId);
    res.json({ data: unreadCounts });
  } catch (error) {
    next(error);
  }
};

// Configuração das rotas
router.post("/", validate(createRoomSchema), createRoom);
router.delete("/:id", validate(roomIdSchema), deleteRoom);
router.get("/", getRooms);
router.get("/:id/details", validate(roomIdSchema), getRoomDetails);
router.post("/:id/members", validate(roomIdSchema), addMemberToRoom);
router.delete("/:id/members/:userId", validate(roomIdSchema), removeMemberFromRoom);
router.get("/:id/available-users", validate(roomIdSchema), getAvailableUsers);
router.get("/:id/all-users", validate(roomIdSchema), getAllUsers);
router.get("/unread-counts", getUnreadCounts);

export default router;
