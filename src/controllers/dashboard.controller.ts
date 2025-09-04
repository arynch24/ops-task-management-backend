import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { errorResponse, successResponse } from '../utils/response';
import { DashboardService } from '../services/dashboard.service';

export const getAdminSummary = async (req: Request, res: Response) => {
  try {

    const startDate = new Date();

    // Normalize to UTC start/end of day
    const startOfDay = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
    const endOfDay = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 23, 59, 59, 999));

    const pendingAssignments = await prisma.taskAssignment.count({
      where: {
        status: 'PENDING',
        schedule: {
          scheduledDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      },
    });

    const completedAssignments = await prisma.taskAssignment.count({
      where: {
        status: 'COMPLETED',
        schedule: {
          scheduledDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      },
    });

    const totalAdhocTasks = await prisma.task.count({
      where: {
        taskType: 'ADHOC',
        dueDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const totalAssignedTasks = pendingAssignments + completedAssignments;

    return successResponse(res, 'Dashboard summary fetched successfully', {
      totalAssignedTasks: totalAssignedTasks,
      pending: pendingAssignments,
      completed: completedAssignments,
      adhoc: totalAdhocTasks
    });
  } catch (error: any) {
    return errorResponse(res, 500, 'Failed to fetch dashboard data');
  }
};


export const getCategorySummary = async (req: Request, res: Response) => {
  try {
    const getTodayTaskSummary = await DashboardService.getTodayTaskSummary();

    successResponse(res, 'Category summary fetched successfully', getTodayTaskSummary);

  } catch (error: any) {
    return errorResponse(res, 500, 'Failed to fetch category summary');
  }
};

export const getMyTaskStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const [pending, completed] = await Promise.all([
      prisma.taskAssignment.count({
        where: { assignedTo: userId, status: 'PENDING' },
      }),
      prisma.taskAssignment.count({
        where: { assignedTo: userId, status: 'COMPLETED' },
      }),
    ]);

    return successResponse(res, 'Task stats fetched successfully', { pending, completed });
  } catch (error: any) {
    return errorResponse(res, 500, 'Failed to fetch task stats');
  }
};