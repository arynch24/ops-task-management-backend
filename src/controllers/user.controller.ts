import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { successResponse, errorResponse } from '../utils/response';

export const getMe = async (req: Request, res: Response) => {
    try {
        const user = await UserService.getMe(req.user.id);
        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }
        return successResponse(res, 'User fetched successfully', user);
    } catch (error: any) {
        return errorResponse(res, 500, 'Failed to fetch user');
    }
};

export const getAllMembers = async (req: Request, res: Response) => {
    try {
        const members = await UserService.getAllMembers();
        return successResponse(res, 'Members fetched successfully', members);
    } catch (error: any) {
        return errorResponse(res, 500, 'Failed to fetch members');
    }
};