import { z } from 'zod';

export const createCategorySchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional().nullable().default(null),
});

export const updateCategorySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable().default(null),
});