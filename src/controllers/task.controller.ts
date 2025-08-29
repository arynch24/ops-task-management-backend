import { Request, Response } from 'express';
import { createTaskSchema } from '../validators/task.validator';
import { TaskService } from '../services/task.service';
import { successResponse, errorResponse } from '../utils/response';

export const createTask = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const createdBy = req.user.id;

        const task = await TaskService.createTask(data, createdBy);

        return successResponse(res, 'Task created successfully', task);
    } catch (error: any) {
        return errorResponse(res, 500, 'Failed to create task');
    }
};

export const getTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 400, 'Invalid task ID');
        }

        const task = await TaskService.getTaskWithAssignments(id);
        if (!task) {
            return errorResponse(res, 404, 'Task not found');
        }

        return successResponse(res, 'Task fetched successfully', task);
    } catch (error: any) {
        return errorResponse(res, 500, 'Failed to fetch task');
    }
};

export const getAllTasks = async (req: Request, res: Response) => {
    try {
        const { limit = 10, page = 1 } = req.query;

        const limitNum = Math.min(Math.max(parseInt(limit as string, 10), 1), 100);
        const pageNum = Math.max(parseInt(page as string, 10), 1);

        const tasks = await TaskService.getUserTasks(req.user.id, limitNum, pageNum);

        return successResponse(res, 'Tasks fetched successfully', tasks);
    } catch (error: any) {
        return errorResponse(res, 500, 'Failed to fetch tasks');
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 400, 'Invalid task ID');
        }

        const parsed = createTaskSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            return errorResponse(res, 400, 'Validation failed');
        }

        const data = parsed.data;

        // Filter out undefined values to match the expected type
        const filteredData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined)
        );

        const updated = await TaskService.updateTask(id, filteredData);

        return successResponse(res, 'Task updated successfully', updated);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return errorResponse(res, 404, 'Task not found');
        }
        return errorResponse(res, 500, 'Failed to update task');
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 400, 'Invalid task ID');
        }

        await TaskService.deleteTask(id);

        return successResponse(res, 'Task deleted successfully', {});
    } catch (error: any) {
        if (error.code === 'P2025') {
            return errorResponse(res, 404, 'Task not found');
        }
        return errorResponse(res, 500, 'Failed to delete task');
    }
};