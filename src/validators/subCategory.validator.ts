import { z } from 'zod';

export const createSubcategorySchema = z.object({
  categoryId: z.string().uuid({ message: 'Invalid category ID' }),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional().nullable().default(null),
});

export const updateSubcategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
});