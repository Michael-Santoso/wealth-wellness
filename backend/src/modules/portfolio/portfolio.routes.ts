import { Router } from "express";
import { z } from "zod";
import { requireUserHeader } from "../../middleware/auth";
import { portfolioService } from "./portfolio.service";

const upsertPortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseCurrency: z.string().length(3).optional(),
  totalValue: z.number().nonnegative(),
  monthlyContribution: z.number().nonnegative(),
  riskProfile: z.enum(["CONSERVATIVE", "BALANCED", "AGGRESSIVE"]),
});

const holdingSchema = z.object({
  symbol: z.string().min(1).max(15),
  name: z.string().min(1).max(120),
  assetType: z.enum(["STOCK", "ETF", "BOND", "CASH", "CRYPTO", "OTHER"]),
  currency: z.string().length(3).optional(),
  quantity: z.number().positive(),
  averageCost: z.number().nonnegative(),
  currentPrice: z.number().nonnegative().optional(),
});

const ingestHoldingsSchema = z.object({
  portfolio: upsertPortfolioSchema,
  holdings: z.array(holdingSchema).min(1).max(500),
});

const createUploadJobSchema = z.object({
  portfolioId: z.string().min(1).optional(),
  source: z.enum(["MANUAL", "CSV", "AI_EXTRACT", "WALLET"]),
  fileName: z.string().min(1).max(255).optional(),
  rawInput: z.string().min(1).max(20000).optional(),
  parsedHoldings: z.array(holdingSchema).max(500).optional(),
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

portfolioRouter.post("/ingest/manual", async (req, res, next) => {
  try {
    const input = ingestHoldingsSchema.parse(req.body);
    const result = await portfolioService.ingestHoldings(res.locals.userId, input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

portfolioRouter.get("/:id/holdings", async (req, res, next) => {
  try {
    const holdings = await portfolioService.getHoldings(req.params.id, res.locals.userId);

    if (!holdings) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.json(holdings);
  } catch (err) {
    next(err);
  }
});

portfolioRouter.post("/upload-jobs", async (req, res, next) => {
  try {
    const input = createUploadJobSchema.parse(req.body);
    const job = await portfolioService.createUploadJob(res.locals.userId, input);

    if (!job) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

portfolioRouter.get("/upload-jobs", async (_req, res, next) => {
  try {
    const jobs = await portfolioService.getUploadJobs(res.locals.userId);
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});
