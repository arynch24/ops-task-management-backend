import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { config } from './index';
import { errorResponse } from "../utils/response";

// Extend Express Request interface to include 'user'
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const JWT_SECRET = config.jwtSecret as string;

// Generate JWT token
export const generateToken = (payload: { id: string; email: string; role: string }) => {
    if (!JWT_SECRET) {
        throw new Error('JWT secret is not defined');
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

// Verify JWT token
export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
};

// Middleware: Protect routes
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return errorResponse(res, 401, 'Access denied. No token provided.');
    }

    try {
        const decoded = verifyToken(token);
        const user = await prisma.users.findUnique({ where: { id: decoded.id } });

        if (!user) {
            return errorResponse(res, 404, 'User not found.');
        }

        req.user = user;
        next();
    } catch (error) {
        return errorResponse(res, 401, 'Invalid or expired token.');
    }
};