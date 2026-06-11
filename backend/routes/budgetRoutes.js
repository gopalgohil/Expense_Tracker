import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  upsertBudget,
  getBudgets,
  deleteBudget,
  getBudgetStatus,
} from '../controllers/budgetController.js';

const router = express.Router();

router.use(protect);

router.get('/status', getBudgetStatus);   // must be before /:id
router.get('/',       getBudgets);
router.post('/',      upsertBudget);
router.delete('/:id', deleteBudget);

export default router;
