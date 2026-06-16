import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateAvatar,
  forgotPassword,
  verifyOTP,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register',        registerUser);
router.post('/login',           loginUser);
router.post('/logout',          logoutUser);
router.get('/me',               protect, getUserProfile);
router.put('/avatar',           protect, updateAvatar);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp',      verifyOTP);
router.post('/reset-password',   resetPassword);

export default router;
