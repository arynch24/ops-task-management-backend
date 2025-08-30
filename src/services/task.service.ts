import { PrismaClient, Task, Prisma } from '@prisma/client';
import { repetitionConfigSchema } from '../validators/task.validator';
import { ScheduleService } from './schedule.service';
import { prisma } from '../config/db';

export class TaskService {

  static async createTask(data: any, createdBy: string) {
    const task = await prisma.task.create({
      data: {
        ...data,
        createdBy,
      },
    });

    // If recurring, generate schedules
    if (task.taskType === 'RECURRING' && task.repetitionConfig) {
      await ScheduleService.generateSchedulesForTask(task);
    }

    return task;
  }

  static async getTaskWithAssignments(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        createdByUser: { select: { firstName: true, lastName: true } },
        taskAssignments: {
          include: {
            assignedToUser: { select: { firstName: true, lastName: true, email: true } },
            schedule: true,
          },
        },
      },
    });
  }

  /**
   * Get tasks with optional assignment details — task-first approach
   */
  static async getUserTasks(
    userId: string,
    filters?: {
      taskType?: 'ADHOC' | 'RECURRING';
      fromDate?: Date;
      toDate?: Date;
    }
  ) {

    const { taskType, fromDate, toDate } = filters || {};
    const startDate = fromDate || new Date();
    const endDate = toDate || new Date();

    // Normalize to UTC start/end of day
    const startOfDay = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
    const endOfDay = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate() + 1));

    // Build where clause for Task
    const taskWhere: Prisma.TaskWhereInput = {
      OR: [
        { createdBy: userId },
      ],
      ...(taskType && { taskType }),
    };

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        title: true,
        description: true,
        taskType: true,
        parameterLabel: true,
        parameterUnit: true,
        dueDate: true, // for ADHOC
        nextDueDate: true,
        category: {
          select: { name: true }
        },
        subcategory: {
          select: { name: true }
        },
        createdByUser: {
          select: { firstName: true, lastName: true }
        },
        // ✅ Get assignments for this user only
        taskAssignments: {
          where: {
            assignedBy: userId,
            OR: [
              // Recurring: filter by schedule date
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
          },
          select: {
            id: true,
            status: true,
            parameterValue: true,
            comment: true,
            completedAt: true,
            assignedToUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            schedule: {
              select: {
                scheduledDate: true,
              },
            },
          },
        },
        // Include schedules for due date filtering
        recurringSchedules: {
          where: {
            scheduledDate: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          select: {
            id: true,
            scheduledDate: true,
          },
          take: 1,
          orderBy: { scheduledDate: 'asc' }
        }
      },
      orderBy: { nextDueDate: 'asc' },
    });

    return tasks.map(task => {
      // ✅ Use schedule date if available, else use task.dueDate
      const dueDate = task.recurringSchedules[0]?.scheduledDate || task.dueDate;

      // ✅ Only show assignment if exists
      const myAssignment = task.taskAssignments[0];
      const myAssignments = task.taskAssignments;

      return {
        taskId: task.id,
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        category: task.category?.name,
        subcategory: task.subcategory?.name,
        parameterLabel: task.parameterLabel,
        parameterUnit: task.parameterUnit,
        dueDate,
        isAssigned: !!myAssignment,
        assignments: myAssignments.map(assignment => ({
          assignmentId: assignment.id,
          status: assignment.status,
          parameterValue: assignment.parameterValue,
          comment: assignment.comment,
          completedAt: assignment.completedAt,
          assignedTo: {
            id: assignment.assignedToUser.id,
            fullName: `${assignment.assignedToUser.firstName} ${assignment.assignedToUser.lastName}`,
            email: assignment.assignedToUser.email,
          },
          dueDate: assignment.schedule?.scheduledDate || task.dueDate,
        })),
        createdBy: task.createdByUser
          ? `${task.createdByUser.firstName} ${task.createdByUser.lastName}`
          : 'Unknown'
      };
    });
  }


  static async updateTask(id: string, data: Prisma.TaskUpdateInput) {
    // 1. Get the existing task
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    // 2. Update the task first (in case other fields change)
    const updatedTask = await prisma.task.update({
      where: { id },
      data,
    });

    // 3. Check if task is recurring and repetitionConfig changed
    if (
      updatedTask.taskType === 'RECURRING' &&
      JSON.stringify(existingTask.repetitionConfig) !== JSON.stringify(updatedTask.repetitionConfig)
    ) {
      // 4. Delete old schedules
      await prisma.recurringTaskSchedule.deleteMany({
        where: { taskId: id },
      });

      // 5. Regenerate new schedules
      await ScheduleService.generateSchedulesForTask(updatedTask);
    }

    return updatedTask;
  }


  static async deleteTask(id: string) {
    return prisma.$transaction([
      // 1. Delete all recurring schedules
      prisma.recurringTaskSchedule.deleteMany({
        where: { taskId: id },
      }),
      // 2. Delete all task assignments
      prisma.taskAssignment.deleteMany({
        where: { taskId: id },
      }),
      // 3. Delete the task
      prisma.task.delete({
        where: { id },
      }),
    ]);
  }
}