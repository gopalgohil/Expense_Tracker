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
  sendRegisterOTP,
  verifyRegisterOTP,
  googleLogin,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendEmail } from '../utils/sendEmail.js';

const router = express.Router();

router.get('/test-email', async (req, res) => {
  try {
    const smtpInfo = {
      host: process.env.SMTP_HOST || 'not set',
      port: process.env.SMTP_PORT || 'not set',
      secure: process.env.SMTP_SECURE || 'not set',
      user: process.env.SMTP_USER || 'not set',
      hasPass: !!process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || 'not set',
      nodeEnv: process.env.NODE_ENV || 'not set',
    };
    
    const info = await sendEmail({
      to: process.env.SMTP_USER || 'gopalgohel249@gmail.com',
      subject: 'Spendwise SMTP Diagnostic',
      html: `<h3>Spendwise SMTP Test</h3><p>If you see this, email sending works from Render!</p>`
    });
    
    return res.json({ success: true, smtpInfo, info });
  } catch (error) {
    return res.status(500).json({
      success: false,
      smtpInfo: {
        host: process.env.SMTP_HOST || 'not set',
        port: process.env.SMTP_PORT || 'not set',
        secure: process.env.SMTP_SECURE || 'not set',
        user: process.env.SMTP_USER || 'not set',
        hasPass: !!process.env.SMTP_PASS,
        from: process.env.SMTP_FROM || 'not set',
        nodeEnv: process.env.NODE_ENV || 'not set',
      },
      error: {
        message: error.message,
        code: error.code,
        command: error.command,
        stack: error.stack,
      }
    });
  }
});

router.post('/register',              registerUser);
router.post('/login',                 loginUser);
router.post('/google-login',          googleLogin);
router.post('/logout',                logoutUser);
router.get('/me',                     protect, getUserProfile);
router.put('/avatar',                 protect, updateAvatar);
router.post('/forgot-password',       forgotPassword);
router.post('/verify-otp',            verifyOTP);
router.post('/reset-password',        resetPassword);
router.post('/send-register-otp',     sendRegisterOTP);
router.post('/verify-register-otp',   verifyRegisterOTP);

export default router;

