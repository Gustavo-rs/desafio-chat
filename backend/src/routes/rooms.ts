import { Router, Request, Response, NextFunction } from "express";
import { RoomService } from "../services/roomService";
import { MessageService } from "../services/messageService";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { createRoomSchema, roomIdSchema } from "../schemas/validation";

const router = Router();
const roomService = new RoomService();
const messageService = new MessageService();

router.use(authenticate);

router.post("/", validate(createRoomSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const room = await roomService.createRoom(name);
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", validate(roomIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await roomService.deleteRoom(id);
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await roomService.getRooms();
    res.json(rooms);
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
