import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
