import { Router } from 'express';
import { getBudget, updateBudget } from '../controllers/budget.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getBudget);
router.put('/', updateBudget);

export default router;
