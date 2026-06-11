import mongoose from 'mongoose';

export const CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
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
      enum: { values: CATEGORIES, message: `Category must be one of: ${CATEGORIES.join(', ')}` },
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

    // ── Recurring fields ──────────────────────────
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceInterval: {
      type: String,
      enum: {
        values: ['monthly', 'weekly', 'yearly'],
        message: 'Interval must be monthly, weekly, or yearly',
      },
      default: null,
    },
    nextDueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-compute nextDueDate before save
expenseSchema.pre('save', function (next) {
  if (this.isRecurring && this.recurrenceInterval) {
    const base = this.date || new Date();
    const d    = new Date(base);
    if (this.recurrenceInterval === 'monthly') d.setMonth(d.getMonth() + 1);
    if (this.recurrenceInterval === 'weekly')  d.setDate(d.getDate() + 7);
    if (this.recurrenceInterval === 'yearly')  d.setFullYear(d.getFullYear() + 1);
    this.nextDueDate = d;
  } else {
    this.nextDueDate = null;
  }
  next();
});

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ isRecurring: 1, nextDueDate: 1 }); // for cron query

export default mongoose.model('Expense', expenseSchema);
