import { Request, Response, NextFunction } from "express";
import { healthService } from "../services/health.service";

export async function getHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    const health = await healthService.getHealthStatus();
    const statusCode = health.status === "ok" ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    next(err);
  }
}
