import { Router } from 'express';
import {
  createTask,
  getTask,
  getAllTasks,
  updateTask,
  deleteTask,
  reassignTask
} from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validator.middleware';
import { createTaskSchema } from '../validators/task.validator';
import { reassignTaskSchema } from '../validators/assignment.validator';

const router = Router();

/** Create a new task
 * POST /api/tasks
 * @description Create a new task
 * @body :{
 *   "title": "string",
 *   "description"(optional): "string",
 *   "categoryId"(optional): "string",
 *   "subcategoryId"(optional): "string",
 *   "taskType": "ADHOC / RECURRING",
 *   "parameterType": z.enum(['NUMBER', 'TEXT', 'DATETIME', 'DROPDOWN', 'BOOLEAN', 'COMMENT']),
 *   "parameterLabel": "string",
 *   "parameterUnit"(optional): "string",
 *   "dropdownOptions"(optional): "string[]",
 *   "dueDate"(optional): "string", // ISO 8601 format compulsory for adhoc tasks
 *   "repetitionConfig"(optional): * Example:
   * {
   * type: "interval",
   * days: 3,
   * atTime: "09:00",
   * }
   * OR
   * {
   * type: "weekly",
   * onDays: ["MON", "WED", "FRI"],
   * atTime: "10:30",
   * }
   * OR
   * {
   * type: "monthly",
   * onDate: 15,
   * atTime: "08:00"
   * }
 * }
 * @returns {Task} - The created task
*/
router.post('/', authenticate, authorize('ADMIN'), validate(createTaskSchema), createTask);

/** Update an existing task
 * PATCH /api/tasks/:id
 * @description Update an existing task
 * @param {string} id - The ID of the task to update
 * @body :{
 *   "title"(optional): "string",
 *   "description"(optional): "string",
 *   "categoryId"(optional): "string",
 *   "subcategoryId"(optional): "string",
 *   "taskType"(optional): "ADHOC / RECURRING",
 *   "parameterType"(optional): z.enum(['NUMBER', 'TEXT', 'DATETIME', 'DROPDOWN', 'BOOLEAN', 'COMMENT']),
 *   "parameterLabel"(optional): "string",
 *   "parameterUnit"(optional): "string",
 *   "dropdownOptions"(optional): "string[]",
 *   "repetitionConfig"(optional): * Example:
 *   {
 *   type: "interval",
 *   days: 3,
 *   atTime: "09:00",
 *   }
 *   OR
 *   {
 *   type: "weekly",
 *   onDays: ["MON", "WED", "FRI"],
 *   atTime: "10:30",
 *   }
 *   OR
 *   {
 *   type: "monthly",
 *   onDate: 15,
 *   atTime: "08:00"
 *   }
 * }
 * @returns {Task} - The updated task
*/
router.patch('/:id', authenticate, authorize('ADMIN'), updateTask);

/** Delete an existing task
 * @returns {Task} - The deleted task
 * @throws {UnauthorizedError} - If user is not authenticated
 * @throws {ForbiddenError} - If user is not an admin
*/
router.delete('/:id', authenticate, authorize('ADMIN'), deleteTask);

/** Get all tasks
 * @returns {Task[]} - The list of all tasks
 * @throws {UnauthorizedError} - If user is not authenticated
*/
router.get('/', authenticate, authorize('ADMIN'), getAllTasks);

/** Get a specific task detail
 * @returns {Task} - The requested task
 * @throws {UnauthorizedError} - If user is not authenticated
 * @throws {NotFoundError} - If task is not found
*/
router.get('/:id', authenticate, getTask);

/** Reassign a task to a new user for (future schedules only)
 * PATCH /api/tasks/:id/assign  // here id is task id
 * @description Reassign a recurring task to a new user for future schedules only
 * @body :{
 *   "userIds": ["string"],
 * }
 * @returns {Task} - The updated task
 * @throws {UnauthorizedError} - If user is not authenticated
 * @throws {ForbiddenError} - If user is not an admin
 * @throws {NotFoundError} - If task is not found
*/
router.patch('/:id/assign', authenticate, authorize('ADMIN'), validate(reassignTaskSchema), reassignTask);

export default router;