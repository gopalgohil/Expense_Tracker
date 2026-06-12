import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateAvatar,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login',    loginUser);
router.post('/logout',   logoutUser);
router.get('/me',        protect, getUserProfile);
router.put('/avatar',    protect, updateAvatar);

export default router;
