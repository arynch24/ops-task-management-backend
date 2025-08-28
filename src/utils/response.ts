import { Response } from "express";

export const successResponse = (res: Response, message = "Success", data: any) => {
  res.status(200).json({ success: true, message, data });
};

export const errorResponse = (res: Response, statusCode = 500, message = "Error") => {
  res.status(statusCode).json({ success: false, message });
};
