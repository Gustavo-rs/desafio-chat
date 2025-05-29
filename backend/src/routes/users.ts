import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { UserService } from "../services/user/UserService";
import { validate } from "../middlewares/validation";
import { createUserSchema, loginSchema } from "../schemas/validation";
import { UserResponse, LoginResponse } from "../models/userModel";
import { AppError } from "../utils/errors";
import { authenticate } from "../middlewares/auth";

const router = Router();
const userService = new UserService();

router.post("/register", validate(createUserSchema), async (req: Request, res: Response<UserResponse>, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const { user } = await userService.createUser(username, password, res);
    
    res.status(201).json({
      id: user.id,
      username: user.username,
      message: "User created successfully"
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Failed to create user", 500));
    }
  }
});

router.post("/login", validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const { user } = await userService.login(username, password, res);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Invalid username or password", 401));
    }
  }
});

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(200).json({ message: "Logged out successfully" });
});

router.get("/verify", authenticate, (req: Request, res: Response) => {
  res.status(200).json({
    message: "authenticated",
    user: {
      id: req.user?.userId,
      username: req.user?.username,
    },
  });
});

export default router;
