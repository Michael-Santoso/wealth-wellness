import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handlers";
import { requestLogger } from "./middleware/request-logger";
import { apiRouter } from "./routes";

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
  })
);
app.use(requestLogger);
app.use(express.json());

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
