import mongoose from 'mongoose';

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
];

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: CATEGORIES, message: `Category must be one of: ${CATEGORIES.join(', ')}` },
    },
    limit: {
      type: Number,
      required: [true, 'Budget limit is required'],
      min: [1, 'Budget limit must be greater than 0'],
    },
  },
  { timestamps: true }
);

// One budget per user/month/category
budgetSchema.index({ userId: 1, month: 1, category: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
