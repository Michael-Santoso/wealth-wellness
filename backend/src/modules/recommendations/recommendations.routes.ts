import { Router } from "express";
import { requireUserHeader } from "../../middleware/auth";
import { recommendationsService } from "./recommendations.service";

export const recommendationsRouter = Router();

recommendationsRouter.use(requireUserHeader);

recommendationsRouter.get("/", async (_req, res, next) => {
  try {
    const items = await recommendationsService.getForUser(res.locals.userId);
    res.json(items);
  } catch (err) {
    next(err);
  }
});