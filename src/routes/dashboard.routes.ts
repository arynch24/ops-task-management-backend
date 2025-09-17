import { Router } from 'express';
import { getMyTaskStats, getCategorySummary } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

/**
 * GET /api/dashboard/category-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get category-wise task summary for the given date range (defaults to today if not provided)
 * returns {
    "success": true,
    "message": "Category summary fetched successfully",
    "data": {
        "totalAssignedTasks": 61,
        "pending": 61,
        "completed": 0,
        "adhoc": 1,
        "categorySummary": [
            {
                "category": "Electrical Maintenance",
                "assignees": [
                    {
                        "name": "Ankit Member",
                        "total": 29,
                        "completed": 0,
                        "pending": 29,
                        "completionRate": 0
                    },
                    {
                        "name": "Shoyeb Member",
                        "total": 2,
                        "completed": 0,
                        "pending": 2,
                        "completionRate": 0
                    },
                    {
                        "name": "Member User",
                        "total": 2,
                        "completed": 0,
                        "pending": 2,
                        "completionRate": 0
                    }
                ],
                "totalTasks": 33,
                "totalCompleted": 0,
                "totalPending": 33,
                "overallCompletionRate": 0
            },
            {
                "category": "Fire Safety Checklist",
                "assignees": [
                    {
                        "name": "Ankit Member",
                        "total": 28,
                        "completed": 0,
                        "pending": 28,
                        "completionRate": 0
                    }
                ],
                "totalTasks": 28,
                "totalCompleted": 0,
                "totalPending": 28,
                "overallCompletionRate": 0
            }
        ]
    }
}
 */
router.get('/category-summary', authenticate, authorize('ADMIN'), getCategorySummary);

router.get('/my-stats', authenticate, getMyTaskStats);

export default router;