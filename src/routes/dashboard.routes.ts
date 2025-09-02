import { Router } from 'express';
import { getAdminSummary, getMyTaskStats } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

/**
 * GET /api/dashboard/summary
 * Get admin dashboard summary
 * return {
    "success": true,
    "message": "Dashboard summary fetched successfully",
    "data": {
        "totalAssignedTasks": 0,
        "pending": 0,
        "completed": 0,
        "adhoc": 0
    }
 * }
*/
router.get('/summary', authenticate, authorize('ADMIN'), getAdminSummary);


router.get('/my-stats', authenticate, getMyTaskStats);

export default router;