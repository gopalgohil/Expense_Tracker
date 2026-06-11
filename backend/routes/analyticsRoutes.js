import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  topCategories,
  monthlyCompare,
  dailyBreakdown,
} from '../controllers/analyticsController.js';

const router = express.Router();
router.use(protect);

router.get('/top-categories',   topCategories);
router.get('/monthly-compare',  monthlyCompare);
router.get('/daily-breakdown',  dailyBreakdown);

export default router;
