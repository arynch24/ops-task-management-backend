import { Request, Response } from 'express';
import { AssignmentService } from '../services/assignment.service';
import { successResponse, errorResponse } from '../utils/response';
import { prisma } from '../config/db';

export const assignTask = async (req: Request, res: Response) => {
    try {
        const { taskId, userIds } = req.body;
        const assignedBy = req.user.id;
        const assignments = await AssignmentService.assignTaskToUsers(taskId, userIds, assignedBy);

        return successResponse(res, 'Task assigned successfully', assignments);
    } catch (error: any) {
        return errorResponse(res, 500, 'Failed to assign task', error.message);
    }
};

export const completeAssignment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 400, 'Assignment ID is required');
        }

        const { parameterValue, comment } = req.body;

        const assignment = await AssignmentService.completeAssignment(id, parameterValue, comment);

        return successResponse(res, 'Task completed successfully', assignment);
    } catch (error: any) {
        return errorResponse(res, 500, 'Failed to complete task');
    }
};

export const getMyAssignments = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        console.log("Fetching assignments for user:", userId);
        const assignments = await AssignmentService.getAssignmentsByUser(userId);
        return successResponse(res, 'Assignments fetched successfully', assignments);
    } catch (error: any) {
        return errorResponse(res, 500, 'Failed to fetch assignments');
    }
};
