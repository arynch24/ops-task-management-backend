import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { errorResponse, successResponse } from '../utils/response';
import { DashboardService } from '../services/dashboard.service';

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