import { Router } from 'express';
import { getDashboardSummary, getCategoryBreakdown, getMonthlyTrend, getRecentExpenses } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/categories', getCategoryBreakdown);
router.get('/monthly', getMonthlyTrend);
router.get('/recent', getRecentExpenses);

export default router;
