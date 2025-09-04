import { prisma } from '../config/db';

export class DashboardService {
  static async getTodayTaskSummary() {
    const today = new Date();
    
    // ✅ Use UTC to avoid timezone issues
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    // 1. Get all task assignments for today (UTC-safe)
    const assignments = await prisma.taskAssignment.findMany({
      where: {
        OR: [
          { createdAt: { gte: startOfDay, lt: endOfDay } },
          { completedAt: { gte: startOfDay, lt: endOfDay } }
        ]
      },
      include: {
        task: {
          select: {
            categoryId: true,
            category: { select: { name: true } }
          }
        },
        assignedToUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // 2. Group by category first, then by assignee
    const categoryMap = new Map<string, any>();

    for (const a of assignments) {
      const categoryId = a.task.categoryId;
      const categoryName = a.task.category?.name || 'Uncategorized';
      const assigneeName = `${a.assignedToUser.firstName} ${a.assignedToUser.lastName}`;

      if (!categoryId) continue;

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category: categoryName,
          assignees: [],
          totalTasks: 0,
          totalCompleted: 0,
          totalPending: 0
        });
      }

      const category = categoryMap.get(categoryId);

      // Find if assignee already exists
      let assignee = category.assignees.find((a: any) => a.name === assigneeName);
      if (!assignee) {
        assignee = {
          name: assigneeName,
          total: 0,
          completed: 0,
          pending: 0,
          completionRate: 0
        };
        category.assignees.push(assignee);
      }

      // Update counts
      assignee.total++;
      if (a.status === 'COMPLETED') {
        assignee.completed++;
      } else {
        assignee.pending++;
      }

      // Update category totals
      category.totalTasks++;
      if (a.status === 'COMPLETED') {
        category.totalCompleted++;
      } else {
        category.totalPending++;
      }
    }

    // 3. Finalize: compute completion rates
    const result = Array.from(categoryMap.values()).map(category => {
      // Compute completion rate for each assignee
      category.assignees = category.assignees.map((a: any) => ({
        ...a,
        completionRate: a.total > 0 ? Math.round((a.completed / a.total) * 100) : 0
      }));

      // Compute overall completion rate for category
      category.overallCompletionRate =
        category.totalTasks > 0
          ? Math.round((category.totalCompleted / category.totalTasks) * 100)
          : 0;

      return category;
    });

    return result;
  }
}