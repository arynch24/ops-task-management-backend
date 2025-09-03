import { TaskAssignment, AssignmentStatus } from '@prisma/client';
// import { NotificationService } from './notification.service';
import { prisma } from '../config/db';

export class AssignmentService {


  /**
 * Assign a task to multiple users
 * - Prevents duplicate assignment
 * - Updates TaskAssignmentGroup
 * - Creates taskAssignments for pending schedules (recurring) or immediately (adhoc)
 * - Returns full user details
 */
  static async assignTaskToUsers(taskId: string, userIds: string[], assignedBy: string) {
    // ✅ Fetch user details outside transaction to reduce load
    const newUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (newUsers.length !== userIds.length) {
      const foundIds = newUsers.map(u => u.id);
      const missing = userIds.filter(id => !foundIds.includes(id));
      throw new Error(`Users not found: ${missing.join(', ')}`);
    }

    return prisma.$transaction(
      async (tx) => {
        const task = await tx.task.findUnique({
          where: { id: taskId },
          include: {
            TaskAssignmentGroup: {
              include: {
                assignedToIds: true
              }
            }, // Only need assignedToIds (IDs)
            recurringSchedules: {
              select: { id: true }, // Only schedule IDs needed
              orderBy: { scheduledDate: 'asc' },
            },
          },
        });

        if (!task) {
          throw new Error('Task not found');
        }

        // Get current assignee IDs from TaskAssignmentGroup
        const currentAssigneeIds = task.TaskAssignmentGroup?.assignedToIds?.map(user => user.id) || [];

        // Prevent re-assigning to already assigned users
        const duplicates = userIds.filter(id => currentAssigneeIds.includes(id));
        if (duplicates.length > 0) {
          throw new Error(`Task already assigned to users: ${duplicates.join(', ')}`);
        }

        // Update or create TaskAssignmentGroup (add new users)
        await tx.taskAssignmentGroup.upsert({
          where: { taskId },
          create: {
            taskId,
            assignedBy,
            assignedToIds: { connect: userIds.map(id => ({ id })) },
          },
          update: {
            assignedBy,
            assignedToIds: { connect: userIds.map(id => ({ id })) },
          },
        });

        // ✅ Create task assignments
        if (task.taskType === 'ADHOC') {
          const data = newUsers.map(user => ({
            taskId,
            assignedTo: user.id,
            assignedBy,
            status: 'PENDING' as const,
          }));

          await tx.taskAssignment.createMany({ data });
        } else {
          const scheduleIds = task.recurringSchedules.map(s => s.id);
          if (scheduleIds.length === 0) {
            throw new Error('No pending schedules to assign');
          }

          const data = newUsers.flatMap(user =>
            scheduleIds.map(scheduleId => ({
              taskId,
              scheduleId,
              assignedTo: user.id,
              assignedBy,
              status: 'PENDING' as const,
            }))
          );

          await tx.taskAssignment.createMany({ data });

          // ✅ Mark schedules as ASSIGNED
          await tx.recurringTaskSchedule.updateMany({
            where: { id: { in: scheduleIds } },
            data: { status: 'ASSIGNED' },
          });
        }

        // ✅ Return success with full user details
        return {
          success: true,
          taskId,
          assignedTo: newUsers,
          message: `Task assigned to ${newUsers.length} user(s)`,
        };
      },
      {
        timeout: 15000, // ✅ 15s timeout to prevent "transaction expired" error
      }
    );
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
          status: 'PENDING',
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

      //5.Update recurringTaskSchedules with status assigned
      await tx.recurringTaskSchedule.updateMany({
        where: {
          taskId,
          status: 'PENDING',
        },
        data: {
          status: 'ASSIGNED',
        },
      });

      // 9. Return count or created assignments
      return { success: true, count: assignmentsData.length };
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