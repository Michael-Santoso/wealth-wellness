import { NextFunction, Request, Response } from "express";

export function requireUserHeader(req: Request, res: Response, next: NextFunction) {
  const userId = req.header("x-user-id");

  if (!userId) {
    return res.status(401).json({ message: "Missing x-user-id header" });
  }

  res.locals.userId = userId;
  next();
}