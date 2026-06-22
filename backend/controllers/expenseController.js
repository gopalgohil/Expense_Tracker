import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import { getPeriodRanges } from '../utils/dateHelper.js';

// @desc    Get all user expenses (with optional filters, search, sort, pagination)
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const {
      month, category,
      search, minAmount, maxAmount,
      sortBy,
      page  = 1,
      limit = 10,
    } = req.query;

    const query = { userId: req.user._id };

    // Category filter
    if (category) query.category = category;

    // Date range filter (supports month, quarter, year, custom startDate/endDate, all-time)
    const ranges = getPeriodRanges(req.query);
    if (ranges.current) {
      query.date = {
        $gte: ranges.current.start,
        $lt:  ranges.current.end,
      };
    }

    // Search — partial match on description OR category (case-insensitive)
    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { description: regex },
        { category:    regex },
      ];
    }

    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      query.amount = {};
      if (minAmount !== undefined && !isNaN(Number(minAmount)))
        query.amount.$gte = Number(minAmount);
      if (maxAmount !== undefined && !isNaN(Number(maxAmount)))
        query.amount.$lte = Number(maxAmount);
    }

    // Sort
    let sortOption = { date: -1 }; // default: newest first
    if (sortBy === 'date_asc')    sortOption = { date: 1 };
    if (sortBy === 'amount_desc') sortOption = { amount: -1 };
    if (sortBy === 'amount_asc')  sortOption = { amount: 1 };

    // Pagination
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip     = (pageNum - 1) * limitNum;

    // Run count + data fetch in parallel
    const [total, expenses] = await Promise.all([
      Expense.countDocuments(query),
      Expense.find(query).sort(sortOption).skip(skip).limit(limitNum),
    ]);

    return res.status(200).json({
      expenses,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Server error fetching expenses' });
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  const { amount, category, date, description, isRecurring, recurrenceInterval } = req.body;

  try {
    if (amount === undefined || amount === null || !category || !date) {
      return res.status(400).json({ message: 'Please provide amount, category, and date' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ message: 'Expense amount must be a positive number' });
    }

    // Reject future dates
    const expenseDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (expenseDate > today) {
      return res.status(400).json({ message: 'Expense date cannot be in the future.' });
    }
    if (isRecurring && !recurrenceInterval) {
      return res.status(400).json({ message: 'Please select a recurrence interval' });
    }

    // Budget Validation
    const yVal = expenseDate.getUTCFullYear();
    const mVal = expenseDate.getUTCMonth() + 1;
    const ymString = `${yVal}-${String(mVal).padStart(2, '0')}`;

    const budget = await Budget.findOne({
      userId: req.user._id,
      category,
      month: ymString
    });

    if (budget) {
      const startOfMonth = new Date(Date.UTC(yVal, mVal - 1, 1));
      const endOfMonth = new Date(Date.UTC(yVal, mVal, 1));

      const existingExpenses = await Expense.find({
        userId: req.user._id,
        category,
        date: { $gte: startOfMonth, $lt: endOfMonth }
      });

      const totalSpent = existingExpenses.reduce((sum, e) => sum + e.amount, 0);
      if (totalSpent + Number(amount) > budget.limit && !req.body.bypassBudget) {
        return res.status(400).json({
          message: `Budget limit exceeded. Your budget for this category is ₹${budget.limit}.`,
          exceedsBudget: true
        });
      }
    }

    const expense = await Expense.create({
      amount:             Number(amount),
      category,
      date:               new Date(date),
      description:        description || '',
      userId:             req.user._id,
      isRecurring:        Boolean(isRecurring),
      recurrenceInterval: isRecurring ? recurrenceInterval : null,
    });

    return res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((v) => v.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    return res.status(500).json({ message: error.message || 'Server error creating expense' });
  }
};

// @desc    Update existing expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  const { amount, category, date, description, isRecurring, recurrenceInterval } = req.body;
  const expenseId = req.params.id;

  try {
    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this expense' });
    }

    if (amount !== undefined) {
      if (Number(amount) <= 0) return res.status(400).json({ message: 'Amount must be positive' });
      expense.amount = Number(amount);
    }
    if (category)              expense.category    = category;
    if (date)                  expense.date        = new Date(date);
    if (description !== undefined) expense.description = description;

    // Handle recurring changes
    if (isRecurring !== undefined) {
      expense.isRecurring = Boolean(isRecurring);
      if (expense.isRecurring) {
        if (!recurrenceInterval) {
          return res.status(400).json({ message: 'Please select a recurrence interval' });
        }
        expense.recurrenceInterval = recurrenceInterval;
      } else {
        expense.recurrenceInterval = null;
        expense.nextDueDate        = null;
      }
    }

    // Budget Validation on Update
    const yVal = expense.date.getUTCFullYear();
    const mVal = expense.date.getUTCMonth() + 1;
    const ymString = `${yVal}-${String(mVal).padStart(2, '0')}`;

    const budget = await Budget.findOne({
      userId: req.user._id,
      category: expense.category,
      month: ymString
    });

    if (budget) {
      const startOfMonth = new Date(Date.UTC(yVal, mVal - 1, 1));
      const endOfMonth = new Date(Date.UTC(yVal, mVal, 1));

      // Find other expenses in this category for this month (excluding the one being updated)
      const existingExpenses = await Expense.find({
        userId: req.user._id,
        category: expense.category,
        date: { $gte: startOfMonth, $lt: endOfMonth },
        _id: { $ne: expense._id }
      });

      const totalSpent = existingExpenses.reduce((sum, e) => sum + e.amount, 0);
      if (totalSpent + expense.amount > budget.limit && !req.body.bypassBudget) {
        return res.status(400).json({
          message: `Budget limit exceeded. Your budget for this category is ₹${budget.limit}.`,
          exceedsBudget: true
        });
      }
    }

    const updated = await expense.save();
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((v) => v.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    return res.status(500).json({ message: error.message || 'Server error updating expense' });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  const expenseId = req.params.id;
  try {
    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    await expense.deleteOne();
    return res.status(200).json({ message: 'Expense deleted successfully', id: expenseId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Server error deleting expense' });
  }
};

export default { getExpenses, createExpense, updateExpense, deleteExpense };
