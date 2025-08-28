import { Router } from 'express';
import { getMe, getAllMembers } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

//for both admin and member
router.get('/me', authenticate, getMe);

//for admin only
router.get('/members', authenticate, authorize('ADMIN'), getAllMembers);

export default router;