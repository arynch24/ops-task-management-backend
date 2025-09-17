// utils/cronJobs.ts
import { schedule } from 'node-cron';
import { prisma } from '../config/db';
import { ScheduleService } from '../services/schedule.service';
import { AssignmentService } from '../services/assignment.service';

const assignmentService = new AssignmentService();

// Every day at 2:00 AM IST
schedule('0 2 * * *', async () => {
    console.log(`[CRON PING] Cron job triggered at ${new Date().toISOString()} (IST)`);
    const now = new Date();

    // Find recurring tasks where:
    // - lastGenerated was more than ~21 days ago
    // - OR it's the first time generating (lastGenerated is old but not null)
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const tasks = await prisma.task.findMany({
        where: {
            taskType: 'RECURRING',
            lastGenerated: { lte: threeWeeksAgo },
        },
    });

    console.log(`Found ${tasks.length} recurring tasks to extend`);

    for (const task of tasks) {
        console.log(`[Cron] Extending schedule for task: ${task.id}`);

        // 1. Generate schedules
        await ScheduleService.generateSchedulesForTask(task);
        console.log('✅ Schedules generated');

        // 2. Get assignees
        const assignees = await AssignmentService.getCurrentAssignees(task.id);

        if (assignees.length === 0) {
            console.log('No assignees found');
        }

        if (assignees.length > 0) {
            // 3. Assign to pending schedules
            const result = await AssignmentService.assignToAllPendingSchedules(task.id, assignees);
            console.log('✅ Assignments created:', result);
        }

        // 4. Update lastGenerated
        await prisma.task.update({
            where: { id: task.id },
            data: {
                lastGenerated: new Date(),
            },
        });
        console.log('✅ lastGenerated updated');
    }
}, {
    timezone: "Asia/Kolkata",   // ensures it runs at 2 AM IST
});