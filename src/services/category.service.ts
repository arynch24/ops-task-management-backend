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
        return prisma.category.findMany({
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
        return prisma.category.delete({
            where: { id },
        });
    }
}