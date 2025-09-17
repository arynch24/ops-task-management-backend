import { PrismaClient, Task, Prisma, ParameterType } from '@prisma/client';
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
    const now = new Date();
    const endOfDayUTC = new Date(now.setUTCHours(23, 59, 59, 999));

    return prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        taskType: true,
        parameterLabel: true,
        parameterUnit: true,
        dueDate: true,
        category: true,
        subcategory: true,
        lastGenerated: true,
        createdByUser: { select: { firstName: true, lastName: true } },
        taskAssignments: {
          where: {
            schedule: {
              scheduledDate: {
                lte: endOfDayUTC,
              }
            }
          },
          include: {
            assignedToUser: { select: { firstName: true, lastName: true, email: true } },
            schedule: {
              select: { scheduledDate: true }
            },
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
    }
  ) {

    const { taskType } = filters || {};
    const startDate = new Date();

    // Normalize to UTC start/end of day
    const startOfDay = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));

    // Build where clause for Task
    const taskWhere: Prisma.TaskWhereInput = {
      // OR: [
      //   // { createdBy: userId },
      // ],
      ...(taskType && { taskType }),
    };

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        title: true,
        description: true,
        taskType: true,
        parameterType: true,
        parameterLabel: true,
        parameterUnit: true,
        dueDate: true, // for ADHOC
        dropdownOptions: true,
        repetitionConfig: true, // Rule-based config for recurring tasks
        category: {
          select: { name: true }
        },
        subcategory: {
          select: { name: true }
        },
        createdByUser: {
          select: { firstName: true, lastName: true }
        },
        // Get assignments for this user only
        taskAssignments: {
          where: {
            // assignedBy: userId,
            OR: [
              {
                schedule: {
                  scheduledDate: {
                    gte: startOfDay,
                  },
                },
              },
              {
                schedule: null, // if schedule itself is nullable
              },
            ],
          },
          select: {
            id: true,
            status: true,
            parameterValue: true,
            comment: true,
            completedAt: true,
            schedule: {
              select: {
                scheduledDate: true,
              },
            },
          },
        },
        TaskAssignmentGroup: {
          select: {
            id: true,
            assignedToIds: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            }
          }
        },
      },
    });

    return tasks.map(task => {
      // ✅ Use schedule date if available, else use task.dueDate
      const myAssignment = task.taskAssignments[0];
      const dueDate = myAssignment?.schedule?.scheduledDate || task.dueDate;

      return {
        taskId: task.id,
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        category: task.category?.name || '',
        subcategory: task.subcategory?.name || '',
        parameterType: task.parameterType,
        parameterLabel: task.parameterLabel,
        parameterUnit: task.parameterUnit,
        dueDate,
        dropdownOptions: task.dropdownOptions,
        repetitionConfig: task.repetitionConfig,
        assignedTo: task.TaskAssignmentGroup?.assignedToIds.map((assignee) => {
          return {
            id: assignee.id,
            firstName: assignee.firstName,
            lastName: assignee.lastName,
            email: assignee.email,
          }
        }) || [],
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

      // 4. Delete all task assignment groups
      await prisma.taskAssignmentGroup.deleteMany({
        where: { taskId: id },
      });

      // 5. Delete all task assignments
      await prisma.taskAssignment.deleteMany({
        where: { taskId: id },
      });

      // 6. Regenerate new schedules
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
      // 3. Delete all task assignment groups
      prisma.taskAssignmentGroup.deleteMany({
        where: { taskId: id },
      }),
      // 4. Delete the task
      prisma.task.delete({
        where: { id },
      }),
    ]);
  }
}