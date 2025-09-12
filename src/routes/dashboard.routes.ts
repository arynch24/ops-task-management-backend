import { Router } from 'express';
import { getAdminSummary, getMyTaskStats, getCategorySummary } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

/**
 * GET /api/dashboard/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get admin dashboard summary for the given date range (defaults to today if not provided)
 * returns {
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

/**
 * GET /api/dashboard/category-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get category-wise task summary for the given date range (defaults to today if not provided)
 * returns {
    "success": true,
    "message": "Category summary fetched successfully",
    "data": [
        {
            "category": "Food Check",
            "assignees": [
                {
                    "name": "Ankit Member",
                    "total": 30,
                    "completed": 0,
                    "pending": 30,
                    "completionRate": 0
                }
            ],
            "totalTasks": 30,
            "totalCompleted": 0,
            "totalPending": 30,
            "overallCompletionRate": 0
        }
    ]
}
 */
router.get('/category-summary', authenticate, authorize('ADMIN'), getCategorySummary);

router.get('/my-stats', authenticate, getMyTaskStats);

export default router;