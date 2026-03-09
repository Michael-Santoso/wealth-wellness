import { Router } from "express";
import { healthRouter } from "./health.routes";
import { authRouter } from "../modules/auth/auth.routes";
import { portfolioRouter } from "../modules/portfolio/portfolio.routes";
import { analyticsRouter } from "../modules/analytics/analytics.routes";
import { recommendationsRouter } from "../modules/recommendations/recommendations.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/portfolio", portfolioRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/recommendations", recommendationsRouter);
