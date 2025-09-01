import { Request, Response } from 'express';
import { createTaskSchema } from '../validators/task.validator';
import { TaskService } from '../services/task.service';
import { successResponse, errorResponse } from '../utils/response';
import { AssignmentService } from '../services/assignment.service';

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
        const { taskType } = req.query;

        const filters: { taskType?: 'ADHOC' | 'RECURRING' } = {};

        if (taskType === 'ADHOC' || taskType === 'RECURRING') {
            filters.taskType = taskType as 'ADHOC' | 'RECURRING';
        }

        const tasks = await TaskService.getUserTasks(req.user.id, filters);

        return successResponse(res, 'Tasks fetched successfully', tasks);
    } catch (error: any) {
        console.error('Error fetching tasks:', error);
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

export const reassignTask = async (req: Request, res: Response) => {
    try {

        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 400, 'Invalid task ID');
        }

        const { userIds } = req.body;
        const assignedBy = req.user.id;

        const result = await AssignmentService.reassignTask(id, userIds, assignedBy);

        return successResponse(res, 'Task reassigned for future instances', result);
    } catch (error: any) {
        if (error.message === 'Task not found') {
            return errorResponse(res, 404, error.message);
        }
        if (error.message === 'Only recurring tasks can be reassigned') {
            return errorResponse(res, 400, error.message);
        }
        return errorResponse(res, 500, 'Failed to reassign task');
    }
};