import { Router, Request, Response, NextFunction } from "express";
import { UserService } from "../services/userService";
import { validate } from "../middlewares/validation";
import { createUserSchema, loginSchema } from "../schemas/validation";
import { UserResponse, LoginResponse } from "../models/user.model";
import { AppError } from "../utils/errors";

const router = Router();
const userService = new UserService();

router.post("/register", validate(createUserSchema), async (req: Request, res: Response<UserResponse>, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const { user, token } = await userService.createUser(username, password, res);
    
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

router.post("/login", validate(loginSchema), async (req: Request, res: Response<LoginResponse>, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const { user, token } = await userService.login(username, password, res);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
      },
      token: token // Incluir token no response como backup
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

export default router;
