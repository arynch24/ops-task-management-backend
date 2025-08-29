import { Request, Response } from 'express';
import { createSubcategorySchema, updateSubcategorySchema } from '../validators/subCategory.validator';
import { SubcategoryService } from '../services/subCategory.service';
import { prisma } from '../config/db';
import { errorResponse, successResponse } from '../utils/response';

export const createSubcategory = async (req: Request, res: Response) => {
  try {
    const parsed = createSubcategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, 400, 'Validation failed');
    }

    const { categoryId, name, description } = parsed.data;
    const createdBy = req.user.id;

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }

    const subcategory = await SubcategoryService.createSubcategory(
      categoryId,
      name,
      description,
      createdBy
    );

    return successResponse(res, 'Subcategory created successfully', { subcategory });
  } catch (error: any) {
    return errorResponse(res, 500, 'Failed to create subcategory');
  }
};

export const getAllSubcategories = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query;
    const subcategories = await SubcategoryService.getAllSubcategories(
      categoryId as string | undefined
    );

    return successResponse(res, 'Subcategories fetched successfully', { subcategories });
  } catch (error: any) {
    return errorResponse(res, 500, 'Failed to fetch subcategories');
  }
};

export const getSubcategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, 400, 'Subcategory ID is required');
    }

    const subcategory = await SubcategoryService.getSubcategoryById(id);

    if (!subcategory) {
      return errorResponse(res, 404, 'Subcategory not found');
    }

    return successResponse(res, 'Subcategory fetched successfully', { subcategory });
  } catch (error: any) {
    return errorResponse(res, 500, 'Failed to fetch subcategory');
  }
};

export const updateSubcategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateSubcategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error,
      });
    }

    const data = parsed.data;

    if (!id || !data) {
      return errorResponse(res, 400, 'Subcategory ID and data are required');
    }

    // Filter out undefined values to match the expected type
    const filteredData: { name?: string; description?: string | null } = {};
    if (data.name !== undefined) {
      filteredData.name = data.name;
    }
    if (data.description !== undefined) {
      filteredData.description = data.description;
    }

    const updated = await SubcategoryService.updateSubcategory(id, filteredData);

    return successResponse(res, 'Subcategory updated successfully', { subcategory: updated });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse(res, 404, 'Subcategory not found');
    }
    return errorResponse(res, 500, 'Failed to update subcategory');
  }
};

export const deleteSubcategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return errorResponse(res, 400, 'Subcategory ID is required');
    }

    await SubcategoryService.deleteSubcategory(id);

    return successResponse(res, 'Subcategory deleted successfully', {});
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse(res, 404, 'Subcategory not found');
    }
    return errorResponse(res, 500, 'Failed to delete subcategory');
  }
};