import { TaskAssignment, AssignmentStatus } from '@prisma/client';
// import { NotificationService } from './notification.service';
import { prisma } from '../config/db';

export class AssignmentService {

  /**
   * Assign a task to multiple users
   */
  static async assignTaskToUsers(taskId: string, userIds: string[], assignedBy: string) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: {
          recurringSchedules: {
            where: { status: 'PENDING' },
            orderBy: { scheduledDate: 'asc' },
          },
        },
      });

      if (!task) throw new Error('Task not found');
      if (task.taskType === 'RECURRING' && task.recurringSchedules.length === 0) {
        throw new Error('No pending schedules to assign');
      }

      let data: any[];

      if (task.taskType === 'ADHOC') {

        const existingAssignments = await tx.taskAssignment.findMany({
          where: {
            taskId,
            assignedTo: { in: userIds },
            status: AssignmentStatus.PENDING,
          },
        });

        if (existingAssignments.length > 0) {
          const existingUserIds = existingAssignments.map(a => a.assignedTo);
          throw new Error(`Task already assigned to users: ${existingUserIds.join(', ')}`);
        }

        data = userIds.map(userId => ({
          taskId,
          assignedTo: userId,
          assignedBy,
          status: AssignmentStatus.PENDING,
        }));

        await tx.taskAssignment.createMany({
          data,
        });
      } else {
        const scheduleIds = task.recurringSchedules.map(s => s.id);

        data = userIds.flatMap(userId =>
          scheduleIds.map(scheduleId => ({
            taskId,
            scheduleId,
            assignedTo: userId,
            assignedBy,
            status: AssignmentStatus.PENDING,
          }))
        );

        await tx.taskAssignment.createMany({
          data,
        });

        await tx.recurringTaskSchedule.updateMany({
          where: { id: { in: scheduleIds } },
          data: { status: 'ASSIGNED' },
        });
      }

      // Record assignment intent for future schedules
      const assignmentGroup = await tx.taskAssignmentGroup.upsert({
        where: { taskId },
        create: {
          taskId,
          assignedToIds: {
            connect: userIds.map(id => ({ id }))
          },
          assignedBy,
        },
        update: {
          assignedToIds: {
            set: userIds.map(id => ({ id }))
          },
          assignedBy
        },
      });

      const assignedTo = tx.taskAssignmentGroup.findUnique({
        where: { taskId },
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
      });

      // Return simple success — don't try to return assignment objects
      return { task, assignedTo };
    });
  }

  /**
   * Complete a task assignment
   */
  static async completeAssignment(id: string, parameterValue: string, comment?: string): Promise<TaskAssignment> {
    const assignment = await prisma.taskAssignment.update({
      where: { id },
      data: {
        parameterValue,
        comment: comment ?? null,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        task: true,
        assignedToUser: true,
        assignedByUser: true,
      },
    });

    // Notify admin
    // await NotificationService.sendTaskCompletedEmail(assignment);

    return assignment;
  }

  /**
   * Get all assignments for a user
   */
  static async getAssignmentsByUser(userId: string) {
    return prisma.taskAssignment.findMany({
      where: { assignedTo: userId },
      include: {
        task: {
          include: {
            category: true,
            subcategory: true,
          },
        },
        schedule: {
          select: {
            scheduledDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get current assignees for a recurring task
   * Uses TaskAssignmentGroup to remember who was assigned
   */
  static async getCurrentAssignees(taskId: string): Promise<string[]> {
    const group = await prisma.taskAssignmentGroup.findUnique({
      where: { taskId },
      include: {
        assignedToIds: true,
      },
    });

    return group?.assignedToIds?.map(user => user.id) || [];
  }

  /**
  * Assign task to all pending (unassigned) schedules
  * Uses batch operations for efficiency
  */
  static async assignToAllPendingSchedules(taskId: string, userIds: string[]) {
    return prisma.$transaction(async (tx) => {
      // 1. Find task creator (for assignedBy)
      const task = await tx.task.findUnique({
        where: { id: taskId },
        select: { createdBy: true }
      });

      if (!task?.createdBy) {
        throw new Error('Task or task creator not found');
      }

      // 2. Find all unassigned schedules
      const pendingSchedules = await tx.recurringTaskSchedule.findMany({
        where: {
          taskId,
          assignmentId: null,
        },
        select: { id: true }
      });

      if (pendingSchedules.length === 0) return [];

      const scheduleIds = pendingSchedules.map(s => s.id);

      // 3. Prepare data for createMany
      const assignmentsData = userIds.flatMap(userId =>
        scheduleIds.map(scheduleId => ({
          taskId,
          scheduleId,
          assignedTo: userId,
          assignedBy: task.createdBy,
          status: 'PENDING' as const,
        }))
      );

      // 4. Create all assignments
      await tx.taskAssignment.createMany({
        data: assignmentsData,
      });

      // 5. Now fetch the created assignments to get their IDs
      // We need IDs to update recurringTaskSchedules.assignmentId
      const createdAssignments = await tx.taskAssignment.findMany({
        where: {
          taskId,
          scheduleId: { in: scheduleIds },
        },
        select: { id: true, scheduleId: true },
      });

      // 6. Map: scheduleId → assignmentId
      const scheduleToAssignmentMap = new Map(
        createdAssignments.map(a => [a.scheduleId, a.id])
      );

      // 7. Prepare update data for recurringTaskSchedules
      const scheduleUpdates = Array.from(scheduleToAssignmentMap.entries())
        .filter(([scheduleId]) => scheduleId !== null)
        .map(([scheduleId, assignmentId]) => ({
          where: { id: scheduleId! },
          data: { assignmentId, status: 'ASSIGNED' as const }
        }));

      // 8. Update all schedules
      await Promise.all(
        scheduleUpdates.map(update =>
          tx.recurringTaskSchedule.update(update)
        )
      );

      // 9. Return count or created assignments
      return { success: true, count: createdAssignments.length };
    });
  }

  /**
 * Reassign a recurring task to new users (future schedules only)
 */
  static async reassignTask(taskId: string, userIds: string[], assignedBy: string) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // Update or create TaskAssignmentGroup
      await tx.taskAssignmentGroup.upsert({
        where: { taskId },
        create: {
          taskId,
          assignedToIds: {
            connect: userIds.map(id => ({ id }))
          },
          assignedBy,
        },
        update: {
          assignedToIds: {
            set: userIds.map(id => ({ id }))
          },
          assignedBy
        },
      });

      return { success: true, taskId, reassignedTo: userIds };
    });
  }
}