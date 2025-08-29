import { Router } from 'express';
import { assignTask, completeAssignment, getMyAssignments } from '../controllers/assignment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validator.middleware';
import { assignTaskSchema, completeAssignmentSchema } from '../validators/assignment.validator';

const router = Router();

// Admin assigns task to members
router.post('/', authenticate, authorize('ADMIN'), validate(assignTaskSchema), assignTask);

// Member completes assigned task
router.patch('/:id/complete', authenticate, validate(completeAssignmentSchema), completeAssignment);

// Member views their assignments
router.get('/', authenticate, getMyAssignments);

export default router;