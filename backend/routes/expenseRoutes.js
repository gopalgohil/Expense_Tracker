import expenseController from '../controllers/expenseController.js';
const { getExpenses, createExpense, updateExpense, deleteExpense } = expenseController;

import { protect } from '../middleware/authMiddleware.js';
import express from 'express';

const router = express.Router();

// Apply auth protection middleware to all expense routes
router.use(protect);

router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/:id')
  .put(updateExpense)
  .delete(deleteExpense);

export default router;
