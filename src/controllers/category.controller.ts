import { Request, Response } from 'express';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';
import { CategoryService } from '../services/category.service';
import { successResponse, errorResponse } from '../utils/response';

export const createCategory = async (req: Request, res: Response) => {
    try {
        const parsed = createCategorySchema.safeParse(req.body);
        if (!parsed.success) {
            return errorResponse(res, 400, 'Validation failed');
        }

        const { name, description } = parsed.data;
        const createdBy = req.user.id;

        const category = await CategoryService.createCategory(name, description, createdBy);

        return successResponse(res, 'Category created successfully', category);
    } catch (error: any) {
        return errorResponse(res, 500, 'Failed to create category');
    }
};

export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await CategoryService.getAllCategories();
        return successResponse(res, 'Categories fetched successfully', categories);
    } catch (error: any) {
        return errorResponse(res, 500, 'Failed to fetch categories');
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 400, 'Category ID is required');
        }

        const category = await CategoryService.getCategoryById(id);
        if (!category) {
            return errorResponse(res, 404, 'Category not found');
        }

        return successResponse(res, 'Category fetched successfully', category);
    } catch (error: any) {
        console.error('Error fetching category:', error);
        return errorResponse(res, 500, 'Failed to fetch category');
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 400, 'Invalid category ID');
        }

        const parsed = updateCategorySchema.safeParse(req.body);
        if (!parsed.success) {
            return errorResponse(res, 400, 'Validation failed');
        }

        const data = parsed.data;

        const updateData: { name?: string; description?: string | null } = {};
        
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;

        const updated = await CategoryService.updateCategory(id, updateData);

        return successResponse(res, 'Category updated successfully', updated);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return errorResponse(res, 404, 'Category not found');
        }
        return errorResponse(res, 500, 'Failed to update category');
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 400, 'Invalid category ID');
        }

        await CategoryService.deleteCategory(id);

        return successResponse(res, 'Category deleted successfully', {});
    } catch (error: any) {
        if (error.code === 'P2025') {
            return errorResponse(res, 404, 'Category not found');
        }
        return errorResponse(res, 500, 'Failed to delete category');
    }
};