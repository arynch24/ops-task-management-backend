import { prisma } from '../config/db';

export class SubcategoryService {

    static async createSubcategory(categoryId: string, name: string, description: string | null, createdBy: string) {
        return prisma.subcategory.create({
            data: {
                categoryId,
                name,
                description,
                createdBy,
            },
        });
    }

    static async getAllSubcategories(categoryId?: string) {
        return prisma.subcategory.findMany({
            where: categoryId ? { categoryId } : {},
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
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

    static async getSubcategoryById(id: string) {
        return prisma.subcategory.findUnique({
            where: { id },
            include: {
                category: true,
                createdByUser: true,
            },
        });
    }

    static async updateSubcategory(id: string, data: { name?: string; description?: string | null }) {
        return prisma.subcategory.update({
            where: { id },
            data,
        });
    }

    static async deleteSubcategory(id: string) {
        return prisma.subcategory.delete({
            where: { id },
        });
    }
}