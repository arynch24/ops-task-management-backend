import express from 'express';
import { sendDailyReport } from '../services/report.service';
import { successResponse, errorResponse } from "../utils/response";
import { config } from '../config';

const router = express.Router();

// Secure with API Key or IAM  
router.post('/send-daily-report', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== config.reportApiKey) {
        return errorResponse(res, 401, 'Unauthorized: Invalid API Key');
    }

    try {
        await sendDailyReport();
        return successResponse(res, 'Daily report sent successfully', {});
    } catch (err: any) {
        console.error('Report generation failed:', err);
        return errorResponse(res, 500, 'Report generation failed', err.message);
    }
});

export default router;