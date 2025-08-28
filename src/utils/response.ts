import { Response } from "express";

export const successResponse = (res: Response, data: any, message = "Success") => {
  res.status(200).json({ success: true, message, data });
};

export const errorResponse = (res: Response, message = "Error", statusCode = 500) => {
  res.status(statusCode).json({ success: false, message });
};
