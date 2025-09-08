import { schedule } from 'node-cron';
import { prisma } from '../config/db';

export class CategoryService {

    static async createCategory(name: string, description: string | null, createdBy: string) {
        return prisma.category.create({
            data: {
                name,
                description,
                createdBy,
            },
        });
    }

    static async getAllCategories() {
        const now = new Date();

        // Use UTC to avoid timezone issues
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const endOfDay = new Date(startOfDay);
        endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

        // 1. Get all categories
        const categories = await prisma.category.findMany({
            include: {
                subcategories: true,
                createdByUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        // 2. Get today's task assignments (only necessary fields)
        const todayAssignments = await prisma.taskAssignment.findMany({
            where: {
                task: {
                    categoryId: { in: categories.map(c => c.id) }
                },
                schedule: {
                    scheduledDate: {
                        gte: startOfDay,
                        lt: endOfDay,
                    }
                }
            },
            select: {
                taskId: true,
                status: true,
                task: {
                    select: {
                        categoryId: true
                    }
                }
            }
        });

        // 3. Group counts by categoryId
        const stats: Record<string, { total: number; completed: number }> = {};

        categories.forEach(cat => {
            stats[cat.id] = { total: 0, completed: 0 };
        });

        todayAssignments.forEach(a => {
            const catId = a.task?.categoryId;
            if (!catId || !stats[catId]) return;

            stats[catId].total++;
            if (a.status === 'COMPLETED') {
                stats[catId].completed++;
            }
        });

        // 4. Return enhanced categories
        return categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            subcategoryCount: cat.subcategories.length,
            totalAssignmentsToday: stats[cat.id]?.total ?? 0,
            completedAssignmentsToday: stats[cat.id]?.completed ?? 0,
            pendingAssignmentsToday: (stats[cat.id]?.total ?? 0) - (stats[cat.id]?.completed ?? 0),
            createdByUser: cat.createdByUser,
        }));
    }

    static async getCategoryById(id: string) {
        return prisma.category.findUnique({
            where: { id },
            include: {
                subcategories: true,
                createdByUser: true,
                tasks: {
                    select: { id: true, title: true, taskType: true }
                }
            },
        });
    }

    static async updateCategory(id: string, data: { name?: string; description?: string | null }) {
        return prisma.category.update({
            where: { id },
            data,
        });
    }

    static async deleteCategory(id: string) {
        return prisma.$transaction(async (tx) => {
            await tx.subcategory.deleteMany({
                where: { categoryId: id },
            });
            return tx.category.delete({
                where: { id },
            });
        });
    }
}