import { z } from 'zod';

// For assigning a task to one or more users
export const assignTaskSchema = z.object({
  taskId: z.string().uuid({ message: 'Invalid task ID' }),
  userIds: z.array(z.string().uuid()).min(1, 'At least one user must be assigned'),
});

// For completing a task
export const completeAssignmentSchema = z.object({
  parameterValue: z.string().min(1, 'Parameter value is required').max(2000),
  comment: z.string().max(500).optional().nullable(),
});

export const reassignTaskSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user must be assigned'),
});