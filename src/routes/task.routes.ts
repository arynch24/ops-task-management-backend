import { Router } from 'express';
import {
    createTask,
    getTask,
    getAllTasks,
    updateTask,
    deleteTask,
} from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validator.middleware';
import { createTaskSchema } from '../validators/task.validator';

const router = Router();

// Task management routes for admin only
router.post('/', authenticate, authorize('ADMIN'), validate(createTaskSchema), createTask);
router.patch('/:id', authenticate, authorize('ADMIN'), updateTask);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteTask);

// Task management routes for all users
router.get('/', authenticate, getAllTasks);
router.get('/:id', authenticate, getTask);

export default router;