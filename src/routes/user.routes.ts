import { Router } from 'express';
import { getMe, getAllMembers } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

/** Get current user 
 * @returns {User} - The current user
*/
router.get('/me', authenticate, getMe);

/** Get all members
 * @returns {User[]} - The list of all members
 * @throws {UnauthorizedError} - If user is not authenticated
 * @throws {ForbiddenError} - If user is not an admin
*/
router.get('/members', authenticate, authorize('ADMIN'), getAllMembers);

export default router;