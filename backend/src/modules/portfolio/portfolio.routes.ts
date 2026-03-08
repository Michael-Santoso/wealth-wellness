import { Router } from "express";
import { z } from "zod";
import { requireUserHeader } from "../../middleware/auth";
import { portfolioService } from "./portfolio.service";

const upsertPortfolioSchema = z.object({
  totalValue: z.number().nonnegative(),
  monthlyContribution: z.number().nonnegative(),
  riskProfile: z.enum(["CONSERVATIVE", "BALANCED", "AGGRESSIVE"]),
});

export const portfolioRouter = Router();

portfolioRouter.use(requireUserHeader);

portfolioRouter.get("/", async (_req, res, next) => {
  try {
    const portfolio = await portfolioService.getByUserId(res.locals.userId);
    res.json(portfolio);
  } catch (err) {
    next(err);
  }
});

portfolioRouter.get("/:id/analytics", async (req, res, next) => {
  try {
    const analytics = await portfolioService.getAnalytics(req.params.id, res.locals.userId);

    if (!analytics) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

portfolioRouter.post("/", async (req, res, next) => {
  try {
    const input = upsertPortfolioSchema.parse(req.body);
    const portfolio = await portfolioService.upsert(res.locals.userId, input);
    res.status(201).json(portfolio);
  } catch (err) {
    next(err);
  }
});
