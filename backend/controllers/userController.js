import User    from '../models/User.js';
import Expense from '../models/Expense.js';
import Budget  from '../models/Budget.js';
import { getCookieOptions } from './authController.js';

const safeUser = (u) => ({
  _id:      u._id,
  name:     u.name,
  email:    u.email,
  avatar:   u.avatar || null,
  currency: u.currency || 'INR',
});

// GET /api/user/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(safeUser(user));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PUT /api/user/profile  — update name, email, currency
export const updateProfile = async (req, res) => {
  try {
    const { name, email, currency } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name)     user.name     = name.trim();
    if (currency) user.currency = currency;

    if (email && email.trim().toLowerCase() !== user.email) {
      const exists = await User.findOne({ email: email.trim().toLowerCase() });
      if (exists) return res.status(400).json({ message: 'This email is already in use.' });
      user.email = email.trim().toLowerCase();
    }

    await user.save();

    return res.status(200).json(safeUser(user));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PUT /api/user/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Please provide current and new password.' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await user.matchPassword(currentPassword);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect.' });

    user.password = newPassword;   // pre-save hook hashes it
    await user.save();
    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// DELETE /api/user/delete-account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password)
      return res.status(400).json({ message: 'Please enter your password to confirm.' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await user.matchPassword(password);
    if (!match) return res.status(400).json({ message: 'Incorrect password. Please try again.' });

    // Delete all user data
    await Promise.all([
      Expense.deleteMany({ userId: req.user._id }),
      Budget.deleteMany({ userId: req.user._id }),
      User.findByIdAndDelete(req.user._id),
    ]);

    // Clear auth cookies
    const clearOpts = {
      ...getCookieOptions(req),
      expires:  new Date(0),
    };
    res.cookie('jwt', '', clearOpts);
    res.cookie('user_id', '', clearOpts);
    res.cookie('user_info', '', { ...clearOpts, httpOnly: false });

    return res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
