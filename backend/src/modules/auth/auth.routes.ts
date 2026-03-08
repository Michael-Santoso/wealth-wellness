import { Router } from "express";
import { z } from "zod";
import { authService } from "./auth.service";

const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
});

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const user = await authService.register(input);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const session = await authService.login(input.email);
    res.json(session);
  } catch (err) {
    next(err);
  }
});