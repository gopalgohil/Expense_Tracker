import mongoose from 'mongoose';

const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Utilities',
  'Housing',
  'Education',
  'Travel',
  'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(', ')}`,
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [200, 'Description cannot exceed 200 characters'],
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for fast per-user queries
expenseSchema.index({ userId: 1, date: -1 });

export default mongoose.model('Expense', expenseSchema);
