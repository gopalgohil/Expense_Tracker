import jwt  from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';

// In-memory store for pending registration OTPs
// Key: email, Value: { otp, expires, verified }
const pendingOTPs = new Map();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Cookie options — HttpOnly prevents JS access (XSS protection)
export const getCookieOptions = (req) => {
  const isProdOrCrossDomain =
    process.env.NODE_ENV === 'production' ||
    (req && req.headers.origin && !req.headers.origin.includes('localhost')) ||
    (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost'));

  return {
    httpOnly: true,                                          // not accessible via JS
    secure:   isProdOrCrossDomain,                           // HTTPS only in cross-domain/prod
    sameSite: isProdOrCrossDomain ? 'none' : 'lax',
    maxAge:   30 * 24 * 60 * 60 * 1000,                    // 30 days in ms
    path:     '/',
  };
};

const sendToken = (req, res, user, statusCode) => {
  const token = generateToken(user._id);
  const cookieOpts = getCookieOptions(req);

  // Auth cookies only — no profile data in cookies or localStorage
  res.cookie('jwt', token, cookieOpts);
  res.cookie('user_id', user._id.toString(), cookieOpts);

  // Profile returned in body for in-memory React state only
  return res.status(statusCode).json({
    _id:      user._id,
    name:     user.name,
    email:    user.email,
    avatar:   user.avatar   || null,
    currency: user.currency || 'INR',
  });
};

// POST /api/auth/send-register-otp
// Validates email, checks for duplicates, sends OTP — does NOT create account yet
export const sendRegisterOTP = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const trimmedEmail = email.trim().toLowerCase();

    // Accept any valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // Reject disposable / obviously fake TLDs (optional light check)
    if (/\.(test|invalid|example|localhost)$/i.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please use a real email address.' });
    }

    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists. Please sign in.' });
    }

    // Generate OTP
    const otp     = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store pending OTP in a temp record (upsert by email in a separate lightweight store)
    // We use a small in-memory map keyed by email — works for single-instance servers.
    // For multi-instance / serverless, swap this for Redis or a PendingRegistration model.
    pendingOTPs.set(trimmedEmail, { otp, expires });

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;">
        <h2 style="color:#1e3825;text-align:center;margin-bottom:20px;">Verify Your Email</h2>
        <p>Hi there,</p>
        <p>You're almost there! Use the OTP below to verify your email and complete your Spendwise registration. This code is valid for <strong>10 minutes</strong>.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:10px;border-radius:10px;margin:24px 0;color:#166534;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0;"/>
        <p style="font-size:13px;color:#9ca3af;text-align:center;">Spendwise — Your Personal Expense Tracker</p>
      </div>`;

    await sendEmail({ to: trimmedEmail, subject: 'Spendwise — Verify Your Email', html });

    return res.status(200).json({ message: 'OTP sent to your email. Please verify to continue.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Failed to send OTP.' });
  }
};

// POST /api/auth/verify-register-otp
export const verifyRegisterOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const trimmedEmail = email.trim().toLowerCase();
    const record = pendingOTPs.get(trimmedEmail);

    if (!record) {
      return res.status(400).json({ message: 'No OTP found for this email. Please request a new one.' });
    }
    if (record.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect OTP. Please check and try again.' });
    }
    if (new Date() > record.expires) {
      pendingOTPs.delete(trimmedEmail);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Mark verified — keep record so registerUser can confirm it
    pendingOTPs.set(trimmedEmail, { ...record, verified: true });

    return res.status(200).json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'OTP verification failed.' });
  }
};

// POST /api/auth/register
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Please provide name, email, and password' });

    const trimmedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // Confirm OTP was verified for this email
    const record = pendingOTPs.get(trimmedEmail);
    if (!record || !record.verified) {
      return res.status(400).json({ message: 'Email not verified. Please verify your email with the OTP first.' });
    }
    if (new Date() > record.expires) {
      pendingOTPs.delete(trimmedEmail);
      return res.status(400).json({ message: 'OTP session expired. Please restart registration.' });
    }

    const userExists = await User.findOne({ email: trimmedEmail });
    if (userExists)
      return res.status(400).json({ message: 'An account with this email already exists.' });

    const user = await User.create({ name: name.trim(), email: trimmedEmail, password });
    if (!user) return res.status(400).json({ message: 'Invalid user data provided' });

    // Clean up pending OTP
    pendingOTPs.delete(trimmedEmail);

    return sendToken(req, res, user, 201);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res.status(400).json({ message: 'Please provide email and password' });

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail }).select('+password');
    if (!user)
      return res.status(401).json({ message: 'No account found with this email. Please register.' });

    if (await user.matchPassword(password)) {
      return sendToken(req, res, user, 200);
    } else {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// POST /api/auth/logout — clear auth cookies
export const logoutUser = (req, res) => {
  const clearOpts = {
    ...getCookieOptions(req),
    expires:  new Date(0),
  };
  res.cookie('jwt', '', clearOpts);
  res.cookie('user_id', '', clearOpts);
  // Legacy cookie — clear if present from older sessions
  res.cookie('user_info', '', { ...clearOpts, httpOnly: false });
  return res.status(200).json({ message: 'Logged out successfully' });
};

// GET /api/auth/me
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({
      _id:      user._id,
      name:     user.name,
      email:    user.email,
      avatar:   user.avatar   || null,
      currency: user.currency || 'INR',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Server error fetching profile' });
  }
};

// PUT /api/auth/avatar
export const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ message: 'No avatar data provided' });
    if (!avatar.startsWith('data:image/'))
      return res.status(400).json({ message: 'Invalid image format' });
    if (avatar.length > 1.4 * 1024 * 1024)
      return res.status(400).json({ message: 'Image too large. Please use an image under 1MB.' });

    const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true });

    return res.status(200).json({
      _id:      user._id,
      name:     user.name,
      email:    user.email,
      avatar:   user.avatar,
      currency: user.currency || 'INR',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Failed to update avatar' });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: 'Please provide a registered email address' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = otpExpiry;
    await user.save();

    // Send email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; text-align: center; margin-bottom: 24px;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your Spendwise account. Please use the following 6-digit One-Time Password (OTP) to reset your password. This OTP is valid for 10 minutes.</p>
        <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; border-radius: 8px; margin: 24px 0; color: #1f2937; border: 1px solid #e5e7eb;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 14px;">If you did not request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 14px; color: #9ca3af; text-align: center;">Spendwise — Your Personal Expense Tracker</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Spendwise Password Reset OTP',
      html,
    });

    return res.status(200).json({ message: 'OTP sent successfully to your email' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Server error sending password reset OTP' });
  }
};

// POST /api/auth/verify-otp
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect OTP. Please check and try again.' });
    }

    if (new Date() > user.resetPasswordOTPExpires) {
      return res.status(400).json({ message: 'This OTP has expired. Please request a new one.' });
    }

    return res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Server error verifying OTP' });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, OTP, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP session' });
    }

    if (new Date() > user.resetPasswordOTPExpires) {
      return res.status(400).json({ message: 'OTP session has expired' });
    }

    // Set password (this will trigger schema pre-save hook to hash password)
    user.password = newPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Server error resetting password' });
  }
};
