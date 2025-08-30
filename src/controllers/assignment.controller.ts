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
        return errorResponse(res, 500, 'Failed to assign task');
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

/**
 * Admin: Get all tasks with full assignment details (including member status, parameter value)
 * Filterable by date and task type
 */
export const getAllTasksWithDetails = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { from, to, taskType } = req.query;

        // Parse date range
        const startDate = from ? new Date(from as string) : new Date();
        const endDate = to ? new Date(to as string) : new Date();

        // Normalize to UTC start/end of day
        const startOfDay = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
        const endOfDay = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate() + 1));

        // Build where clause for taskAssignment
        const assignmentWhere: any = {
            OR: [
                // Recurring: filter by scheduledDate
                {
                    schedule: {
                        scheduledDate: {
                            gte: startOfDay,
                            lt: endOfDay,
                        },
                    },
                },
                // Ad-hoc: filter by createdAt
                {
                    task: {
                        dueDate: {
                            gte: startOfDay,
                            lt: endOfDay,
                        },
                    }
                },
            ],
            task:{
                createdBy: userId
            }
        };

        // Fetch all assignments in date range
        const assignments = await prisma.taskAssignment.findMany({
            where: assignmentWhere,
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        taskType: true,
                        parameterType: true,
                        parameterLabel: true,
                        parameterUnit: true,
                        category: {
                            select: { name: true }
                        },
                        subcategory: {
                            select: { name: true }
                        },
                        createdByUser: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        },
                        dueDate: true
                    }
                },
                assignedToUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                },
                schedule: {
                    select: {
                        scheduledDate: true,
                        status: true
                    }
                }
            },
            orderBy: [
                { task: { title: 'asc' } },
                { schedule: { scheduledDate: 'asc' } }
            ]
        });

        // Filter by taskType if specified
        const filtered = assignments.filter(a => !taskType || a.task.taskType === taskType);

        // Transform response
        const result = filtered.map(a => ({
            assignmentId: a.id,
            taskId: a.task.id,
            taskTitle: a.task.title,
            taskDescription: a.task.description,
            taskType: a.task.taskType,
            category: a.task.category?.name,
            subcategory: a.task.subcategory?.name,
            parameterLabel: a.task.parameterLabel,
            parameterUnit: a.task.parameterUnit,
            dueDate: a.schedule?.scheduledDate || a.task.dueDate,
            status: a.status,
            completedAt: a.completedAt,
            parameterValue: a.parameterValue, // e.g., "22.5", "Yes", "High"
            comment: a.comment,
            assignedTo: {
                id: a.assignedToUser.id,
                fullName: `${a.assignedToUser.firstName} ${a.assignedToUser.lastName}`,
                email: a.assignedToUser.email,
                role: a.assignedToUser.role
            },
            createdBy: a.task.createdByUser
                ? `${a.task.createdByUser.firstName} ${a.task.createdByUser.lastName}`
                : 'Unknown'
        }));

        return successResponse(res, 'Admin: Tasks and assignments fetched successfully', result);
    } catch (error: any) {
        console.error('Error in admin task fetch:', error);
        return errorResponse(res, 500, 'Failed to fetch tasks');
    }
};