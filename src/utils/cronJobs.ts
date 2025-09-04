// utils/cronJobs.ts
import { schedule } from 'node-cron';
import { prisma } from '../config/db';
import { ScheduleService } from '../services/schedule.service';
import { AssignmentService } from '../services/assignment.service';

const assignmentService = new AssignmentService();

// Every day at 2:00 AM IST
schedule('0 2 * * *', async () => {
    const now = new Date();

    // Find recurring tasks where:
    // - lastGenerated was more than ~30 days ago
    // - OR it's the first time generating (lastGenerated is old but not null)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const tasks = await prisma.task.findMany({
        where: {
            taskType: 'RECURRING',
            lastGenerated: { lte: oneMonthAgo },
        },
    });

    for (const task of tasks) {
        console.log(`[Cron] Extending schedule for task: ${task.id}`);

        // Generate next month of schedules
        await ScheduleService.generateSchedulesForTask(task);

        // Auto-assign to same users
        const assignees = await AssignmentService.getCurrentAssignees(task.id);
        if (assignees.length > 0) {
            await AssignmentService.assignToAllPendingSchedules(task.id, assignees);
        }

        // Update lastGenerated to NOW
        await prisma.task.update({
            where: { id: task.id },
            data: {
                lastGenerated: new Date(),
            },
        });
    }
}, {
    timezone: "Asia/Kolkata",   // ensures it runs at 2 AM IST
});