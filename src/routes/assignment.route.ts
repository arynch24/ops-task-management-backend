import { Router } from 'express';
import { assignTask, completeAssignment, getMyAssignments } from '../controllers/assignment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validator.middleware';
import { assignTaskSchema, completeAssignmentSchema } from '../validators/assignment.validator';

const router = Router();

/** API Prefix: /api/assignments */

/** Admin assigns task to members
 * POST /api/assignments
 * @description Assign a task to a member
 * @body :{
 *   "userIds": "string[]",
 *   "taskId": "string"
 * }
 * @returns {Assignment} - The created assignment
 */
router.post('/', authenticate, authorize('ADMIN'), validate(assignTaskSchema), assignTask);

/** Member marks assignment as complete
 * PATCH /api/assignments/:id/complete 
 * id is the assignment id.
 * @description Mark an assignment as complete
 * @body :{
 *   "parameterValue": "string",
 *   "comment"(optional): "string"
 * }
 * @returns {Assignment} - The updated assignment
 */
router.patch('/:id/complete', authenticate, validate(completeAssignmentSchema), completeAssignment);

/** Member views their assignments
 * @returns {Assignment[]} - The list of assignments
 */
router.get('/', authenticate, authorize('MEMBER'), getMyAssignments);


export default router;