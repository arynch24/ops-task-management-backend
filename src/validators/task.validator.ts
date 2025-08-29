import { z } from 'zod';

// For dropdown, parameter is string from list
export const dropdownOptionsSchema = z.array(z.string()).min(1).max(20).optional();

// 🔹 Extract repetitionConfigSchema so it can be reused
export const repetitionConfigSchema = z.object({
  type: z.enum(['interval', 'weekly', 'monthly']),
  atTime: z.string().regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, 'Invalid time format HH:mm'),
  // Removed: timezone
  endsAfterMonths: z.number().int().min(1).max(12).default(6),
}).and(
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('interval'),
      days: z.number().int().positive(),
    }),
    z.object({
      type: z.literal('weekly'),
      onDays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).min(1),
    }),
    z.object({
      type: z.literal('monthly'),
      onDate: z.number().int().min(1).max(31),
    }),
  ])
);

// 🔹 Now use it in createTaskSchema
export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  subcategoryId: z.string().uuid().nullable().optional(),
  taskType: z.enum(['ADHOC', 'RECURRING']),
  parameterType: z.enum(['NUMBER', 'TEXT', 'DATETIME', 'DROPDOWN', 'BOOLEAN', 'COMMENT']),
  parameterLabel: z.string().min(1).max(255),
  parameterUnit: z.string().max(50).optional().nullable(),
  parameterIsRequired: z.boolean().default(true),
  dropdownOptions: z.array(z.string()).min(1).max(20).optional(),
  repetitionConfig: repetitionConfigSchema.optional(),
  timezone: z.string().default('UTC'),
})
  .refine(
    (data) => {
      if (data.taskType === 'RECURRING' && !data.categoryId) {
        return false;
      }
      return true;
    },
    {
      message: 'Category is required for recurring tasks',
      path: ['categoryId'],
    }
  );

// 🔹 Export type for reuse
export type RepetitionConfig = z.infer<typeof repetitionConfigSchema>;