import { Task, ScheduleStatus } from '@prisma/client';
import { addMonths, isAfter, addDays } from 'date-fns';
import { prisma } from '../config/db';
import { repetitionConfigSchema, RepetitionConfig } from '../validators/task.validator';

export class ScheduleService {
    /**
     * Generates dates for interval-based recurring tasks (e.g., every X days)
     */
    private static generateIntervalDates(config: RepetitionConfig, startDate: Date): Date[] {
        if (config.type !== 'interval') {
            throw new Error('Invalid config type for interval generation');
        }
        const { days, atTime } = config;
        const [hourStr, minuteStr] = atTime.split(':');

        if (!hourStr || !minuteStr) {
            console.error(`Invalid atTime format: ${atTime}`);
            return [];
        }

        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (isNaN(hour) || isNaN(minute)) {
            console.error(`Invalid atTime format: ${atTime}`);
            return [];
        }

        const endDate = addMonths(startDate, 1);
        const dates: Date[] = [];

        // Start from the first occurrence at the specified time
        let current = new Date(startDate);
        current.setUTCHours(hour, minute, 0, 0); // ✅ Always use UTC methods

        // If the first occurrence is in the past, move forward by `days` intervals
        while (current < startDate) {
            current = addDays(current, days);
        }

        // Generate all occurrences within the 6-month window
        while (current <= endDate) {
            dates.push(new Date(current)); // Clone to avoid mutation
            current = addDays(current, days);
        }

        console.log(`[Interval] Generated ${dates.length} dates:`, dates.map(d => d.toISOString()));
        return dates;
    }

    /**
     * Generates dates for weekly recurring tasks (e.g., every Mon, Wed, Fri)
     */
    private static generateWeeklyDates(config: RepetitionConfig, startDate: Date): Date[] {
        if (config.type !== 'weekly') {
            throw new Error('Invalid config type for weekly generation');
        }
        const { onDays, atTime } = config;
        const dayMap: Record<string, number> = {
            SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
        };
        const targetDays = onDays.map(d => dayMap[d]);
        const [hourStr, minuteStr] = atTime.split(':');

        if (!hourStr || !minuteStr) {
            console.error(`Invalid atTime format: ${atTime}`);
            return [];
        }

        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (isNaN(hour) || isNaN(minute)) {
            console.error(`Invalid atTime format: ${atTime}`);
            return [];
        }

        const endDate = addMonths(startDate, 1);
        const dates: Date[] = [];

        let current = new Date(startDate);
        current.setUTCHours(hour, minute, 0, 0);

        // Align to next valid weekday
        while (!targetDays.includes(current.getDay()) || current < startDate) {
            current = addDays(current, 1);
        }

        while (current <= endDate) {
            if (targetDays.includes(current.getDay())) {
                dates.push(new Date(current));
            }
            current = addDays(current, 1);
        }

        console.log(`[Weekly] Generated ${dates.length} dates:`, dates.map(d => d.toISOString()));
        return dates;
    }

    /**
     * Generates dates for monthly recurring tasks (e.g., on the 15th of each month)
     */
    private static generateMonthlyDates(config: RepetitionConfig, startDate: Date): Date[] {
        if (config.type !== 'monthly') {
            throw new Error('Invalid config type for monthly generation');
        }
        const { onDate, atTime } = config;
        const [hourStr, minuteStr] = atTime.split(':');

        if (!hourStr || !minuteStr) {
            console.error(`Invalid atTime format: ${atTime}`);
            return [];
        }

        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (isNaN(hour) || isNaN(minute)) {
            console.error(`Invalid atTime format: ${atTime}`);
            return [];
        }

        const endDate = addMonths(startDate, 1);
        const dates: Date[] = [];

        // Start from the given date in the current month
        let current = new Date(startDate.getFullYear(), startDate.getMonth(), onDate);
        current.setUTCHours(hour, minute, 0, 0);

        // If it's in the past, move to next month
        if (current < startDate) {
            current = addMonths(current, 1);
        }

        while (current <= endDate) {
            dates.push(new Date(current));
            current = addMonths(current, 1);
        }

        console.log(`[Monthly] Generated ${dates.length} dates:`, dates.map(d => d.toISOString()));
        return dates;
    }

    /**
     * Main method: Generate recurring schedules for a task and update nextDueDate
     */
    static async generateSchedulesForTask(task: Task) {
        if (task.taskType !== 'RECURRING' || !task.repetitionConfig) {
            console.log(`Skipping schedule generation for task ${task.id} (not recurring or no config)`);
            return;
        }

        let config: RepetitionConfig;
        try {
            config = repetitionConfigSchema.parse(task.repetitionConfig);
        } catch (error) {
            console.error(`Invalid repetitionConfig for task ${task.id}:`, error);
            return;
        }

        // ✅ Start from the last existing schedule, not task.createdAt
        const lastSchedule = await prisma.recurringTaskSchedule.findFirst({
            where: { taskId: task.id },
            orderBy: { scheduledDate: 'desc' },
        });

        const startDate = lastSchedule ? addDays(lastSchedule.scheduledDate, 1) : new Date(task.createdAt);
        const endDate = addMonths(startDate, 1); // Only generate 1 month at a time

        const generators = {
            interval: ScheduleService.generateIntervalDates,
            weekly: ScheduleService.generateWeeklyDates,
            monthly: ScheduleService.generateMonthlyDates,
        };

        const generate = generators[config.type];
        if (!generate) {
            console.error(`Unsupported recurrence type: ${config.type} for task ${task.id}`);
            return;
        }

        let dateList: Date[];
        try {
            dateList = generate(config, startDate);
        } catch (error) {
            console.error(`Failed to generate dates for task ${task.id}:`, error);
            return;
        }

        if (dateList.length === 0) {
            console.warn(`No dates generated for task ${task.id}`);
            return;
        }

        // ✅ Sort to find next due date
        const sortedDates = [...dateList].sort((a, b) => a.getTime() - b.getTime());
        const nextDueDate = sortedDates[0];

        const schedules = sortedDates.map(date => ({
            taskId: task.id,
            scheduledDate: date,
            status: 'PENDING' as ScheduleStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        try {
            await prisma.recurringTaskSchedule.createMany({
                data: schedules,
            });
            console.log(`✅ Created ${schedules.length} schedules for task ${task.id}`);
        } catch (error) {
            console.error(`❌ Failed to create schedules for task ${task.id}:`, error);
            return;
        }

        // ✅ Update nextDueDate and lastGenerated
        if (nextDueDate) {
            try {
                await prisma.task.update({
                    where: { id: task.id },
                    data: {
                        nextDueDate,
                        lastGenerated: new Date(),
                    },
                });
                console.log(`✅ Updated nextDueDate for task ${task.id} to ${nextDueDate.toISOString()}`);
            } catch (error) {
                console.error(`❌ Failed to update task ${task.id} with nextDueDate:`, error);
            }
        }
    }
}