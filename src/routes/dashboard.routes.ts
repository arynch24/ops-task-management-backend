import { Router } from 'express';
import { getAdminSummary, getMyTaskStats } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

router.get('/summary', authenticate, authorize('ADMIN'), getAdminSummary);
router.get('/my-stats', authenticate, getMyTaskStats);

export default router;