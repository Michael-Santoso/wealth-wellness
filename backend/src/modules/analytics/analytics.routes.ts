import { Router } from "express";
import { requireUserHeader } from "../../middleware/auth";
import { analyticsService } from "./analytics.service";

export const analyticsRouter = Router();

analyticsRouter.use(requireUserHeader);

analyticsRouter.get("/summary", async (_req, res, next) => {
  try {
    const summary = await analyticsService.getSummary(res.locals.userId);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});