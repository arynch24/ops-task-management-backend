import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt'; // Reuse JWT logic
import { prisma } from '../config/db';
import { errorResponse,successResponse } from '../utils/response';

// 🔐 Authenticate: Check if user is logged in
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return errorResponse(res, 401, 'Access denied. No token provided.');
  }

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return errorResponse(res, 401, 'Invalid token. User not found.');
    }

    req.user = user;
    next();
  } catch (error: any) {
    return errorResponse(res, 401, 'Invalid or expired token.');
  }
};