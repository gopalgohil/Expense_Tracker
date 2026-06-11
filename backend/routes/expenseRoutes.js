import expenseController from '../controllers/expenseController.js';
const { getExpenses, createExpense, updateExpense, deleteExpense } = expenseController;

import { exportCSV, exportPDF } from '../controllers/exportController.js';
import { protect } from '../middleware/authMiddleware.js';
import express from 'express';

const router = express.Router();

router.use(protect);

// ── Export routes (must be before /:id) ──
router.get('/export/csv', exportCSV);
router.get('/export/pdf', exportPDF);

// ── CRUD routes ──
router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/:id')
  .put(updateExpense)
  .delete(deleteExpense);

export default router;
