import { Request, Response, NextFunction } from 'express';
import { errorResponse,successResponse } from '../utils/response';

type Role = 'admin' | 'member';

// 🔑 Authorization: Check if user has required role
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized. Please log in.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, `Access denied. Required roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}.`);
    }

    next();
  };
};