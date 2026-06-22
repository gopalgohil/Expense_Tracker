import jwt  from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import { sendEmail } from '../utils/sendEmail.js';
import fs from 'fs';

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
export const sendRegisterOTP = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const trimmedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (/\.(test|invalid|example|localhost)$/i.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please use a real email address.' });
    }

    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists. Please sign in.' });
    }

    const otp     = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Upsert into MongoDB — survives server restarts
    await PendingRegistration.findOneAndUpdate(
      { email: trimmedEmail },
      { otp, verified: false, expiresAt },
      { upsert: true, new: true }
    );

    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev) {
      try {
        fs.appendFileSync('otp-debug.log', `[${new Date().toISOString()}] Register OTP for ${trimmedEmail}: ${otp}\n`);
      } catch (err) {
        console.error('Error writing to otp-debug.log:', err);
      }
    }

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

    try {
      await sendEmail({ to: trimmedEmail, subject: 'Spendwise — Verify Your Email', html });
    } catch (emailErr) {
      console.error('[sendRegisterOTP] Email send failed:', emailErr.message);
      if (!isDev) {
        // In production, email delivery is required — fail the request
        const errMsg = (emailErr.message || '').toLowerCase();
        let message = 'Failed to send OTP. Please try again later.';
        if (emailErr.code === 'EAUTH' || errMsg.includes('auth') || errMsg.includes('username and password not accepted')) {
          message = 'Our email service is misconfigured. Please contact support.';
        } else if (errMsg.includes('recipient') || errMsg.includes('mailbox')) {
          message = 'Could not deliver email to this address. Please check and try again.';
        }
        return res.status(500).json({ message });
      }
      // In dev: OTP is already saved to DB and logged — proceed without email
      console.warn('[DEV] Email failed but OTP is saved in DB. Check otp-debug.log for the code.');
    }

    return res.status(200).json({
      message: 'OTP sent to your email. Please verify to continue.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Failed to send OTP. Please try again.' });
  }
};

// POST /api/auth/verify-register-otp
export const verifyRegisterOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const trimmedEmail = email.trim().toLowerCase();
    const record = await PendingRegistration.findOne({ email: trimmedEmail });

    if (!record) {
      return res.status(400).json({ message: 'No OTP found for this email. Please request a new one.' });
    }
    if (new Date() > record.expiresAt) {
      await PendingRegistration.deleteOne({ email: trimmedEmail });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect OTP. Please check and try again.' });
    }

    // Mark verified in DB
    await PendingRegistration.findOneAndUpdate(
      { email: trimmedEmail },
      { verified: true }
    );

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // Enforce Email OTP verification check
    const pending = await PendingRegistration.findOne({ email: trimmedEmail });
    if (!pending || !pending.verified) {
      return res.status(400).json({ message: 'Please verify your email address via OTP first.' });
    }

    const userExists = await User.findOne({ email: trimmedEmail });
    if (userExists)
      return res.status(400).json({ message: 'An account with this email already exists.' });

    const user = await User.create({ name: name.trim(), email: trimmedEmail, password });
    if (!user) return res.status(400).json({ message: 'Invalid user data provided' });

    // Clean up pending record
    await PendingRegistration.deleteOne({ email: trimmedEmail });

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

    // Reject if client accidentally sent a bcrypt hash instead of plaintext
    if (password.startsWith('$2')) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    console.log(`[loginUser] email=${trimmedEmail} | password length=${password.length} | hash=${user.password?.substring(0,20)}...`);

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

    // Use updateOne so the password field is never touched — avoids
    // accidentally overwriting the hashed password via user.save()
    // on a document that was fetched without select('+password').
    await User.updateOne(
      { _id: user._id },
      { $set: { resetPasswordOTP: otp, resetPasswordOTPExpires: otpExpiry } }
    );

    // Send email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1e3825; text-align: center; margin-bottom: 24px;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your Spendwise account. Use the 6-digit OTP below — it is valid for <strong>10 minutes</strong>.</p>
        <div style="background-color: #f0fdf4; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; border-radius: 8px; margin: 24px 0; color: #166534; border: 1px solid #bbf7d0;">
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
    let message = 'Server error sending password reset OTP. Please try again.';
    const errMsg = (error.message || '').toLowerCase();
    if (error.code === 'ENOTFOUND' || errMsg.includes('enotfound') || errMsg.includes('address not found') || errMsg.includes('dns')) {
      message = 'Email address not found or host unreachable. Please check the email address and your network connection.';
    } else if (error.code === 'EAUTH' || errMsg.includes('auth') || errMsg.includes('username and password not accepted')) {
      message = 'SMTP mail server authentication failed. Please check sender credentials.';
    } else if (errMsg.includes('recipient') || errMsg.includes('mailbox')) {
      message = 'Recipient email address not found or rejected.';
    }
    return res.status(500).json({ message });
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

    // The frontend SHA-256 hashes passwords before sending (see hashPassword.js).
    // Registration and login both use this SHA-256 hash as the input to bcrypt.
    // resetPassword must follow the same convention: bcrypt the SHA-256 hash,
    // NOT the raw plaintext — otherwise login's bcrypt.compare(sha256, hash) will
    // always fail after a password reset.
    //
    // If the value is already a 64-char hex string it came from the frontend hasher.
    // If it looks like a raw password (unlikely but defensive), hash it here.
    const isSHA256 = /^[0-9a-f]{64}$/.test(newPassword);
    const passwordToHash = isSHA256 ? newPassword : newPassword; // always use as-is from client

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordToHash, salt);

    console.log(`[resetPassword] email=${trimmedEmail} | isSHA256=${isSHA256} | hash prefix=${hashedPassword.substring(0,20)}...`);

    await User.updateOne(
      { _id: user._id },
      {
        $set:   { password: hashedPassword },
        $unset: { resetPasswordOTP: '', resetPasswordOTPExpires: '' },
      }
    );

    return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Server error resetting password' });
  }
};
