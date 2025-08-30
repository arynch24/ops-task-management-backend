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
        recurringSchedules: {
          orderBy: { scheduledDate: 'asc' },
          take: 10,
        },
        taskAssignments: {
          include: {
            assignedToUser: { select: { firstName: true, lastName: true, email: true } },
            schedule: true,
          },
        },
      },
    });
  }

  static async getUserTasks(userId: string, limit: number = 10, page: number = 1) {
    const skip = (page - 1) * limit;

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { taskAssignments: { some: { assignedTo: userId } } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        taskType: true,
        nextDueDate: true,
        createdAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        taskAssignments: {
          select: {
            assignedToUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          where: {
            status: 'PENDING',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });

    // Flatten and remove taskAssignments
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      nextDueDate: task.nextDueDate,
      createdAt: task.createdAt,
      category: task.category,
      createdByUser: task.createdByUser,
      assignedTo: task.taskAssignments.map(a => a.assignedToUser),
    }));
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