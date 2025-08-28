import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { successResponse, errorResponse } from "../utils/response";

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.getAllUsers();
    successResponse(res, users, "Users fetched successfully");
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.createUser(req.body);
    successResponse(res, user, "User created successfully");
  } catch (err) {
    next(err);
  }
};
