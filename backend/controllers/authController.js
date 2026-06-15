import jwt  from 'jsonwebtoken';
import User from '../models/User.js';

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

// POST /api/auth/register
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Please provide name, email, and password' });

    // Email Validation Rules
    const trimmedEmail = email.trim();
    if (/\s/.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Email cannot contain spaces.' });
    }
    const atCount = (trimmedEmail.match(/@/g) || []).length;
    if (atCount !== 1) {
      return res.status(400).json({ message: 'Email must contain exactly one "@" symbol.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.(com|in)$/i;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Email must follow a valid format (e.g. user@gmail.com, user@yahoo.in, user@company.co.in) and end with .com or .in.' });
    }

    const userExists = await User.findOne({ email: trimmedEmail });
    if (userExists)
      return res.status(400).json({ message: 'User already exists with this email' });

    const user = await User.create({ name, email: trimmedEmail, password });
    if (!user) return res.status(400).json({ message: 'Invalid user data provided' });

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

    const user = await User.findOne({ email });
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
