import mongoose from 'mongoose';

// Temporarily stores OTP data for email verification during registration.
// Document is deleted once registration completes or expires.
const pendingRegistrationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    // MongoDB TTL index — auto-deletes document after expiry
    index: { expires: 0 },
  },
}, { timestamps: true });

export default mongoose.model('PendingRegistration', pendingRegistrationSchema);
