import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { errorResponse, successResponse } from '../utils/response';
import { DashboardService } from '../services/dashboard.service';

export const getAdminSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    console.log("Received dates:", startDate, endDate);

    // Use today's date as default if no dates provided
    const today = new Date();
    const start = startDate ? new Date(startDate as string) : new Date(today);
    const end = endDate ? new Date(endDate as string) : new Date(today);

    // Set to start and end of day in local timezone
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const pendingAssignments = await prisma.taskAssignment.count({
      where: {
        status: 'PENDING',
        schedule: {
          scheduledDate: {
            gte: start,
            lte: end
          }
        }
      },
    });

    const completedAssignments = await prisma.taskAssignment.count({
      where: {
        status: 'COMPLETED',
        schedule: {
          scheduledDate: {
            gte: start,
            lte: end
          }
        }
      },
    });

    const totalAdhocTasks = await prisma.task.count({
      where: {
        taskType: 'ADHOC',
        dueDate: {
          gte: start,
          lte: end
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
    const { startDate, endDate } = req.query;

    const getCategorySummary = await DashboardService.getTodayTaskSummary(startDate as string, endDate as string);

    return successResponse(res, 'Category summary fetched successfully', getCategorySummary);

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