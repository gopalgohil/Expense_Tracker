import Expense from '../models/Expense.js';

// @desc    Get all user expenses (with optional month & category filters)
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const { month, category } = req.query;
    const query = { userId: req.user._id };

    // Filter by Category
    if (category) {
      query.category = category;
    }

    // Filter by Month (Format: YYYY-MM)
    if (month) {
      const parts = month.split('-');
      if (parts.length === 2) {
        const year = parseInt(parts[0]);
        const m = parseInt(parts[1]);

        if (!isNaN(year) && !isNaN(m) && m >= 1 && m <= 12) {
          // Define start and end of the month in UTC
          const startDate = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0, 0));
          const endDate = new Date(Date.UTC(year, m, 1, 0, 0, 0, 0)); // Start of next month (exclusive)

          query.date = {
            $gte: startDate,
            $lt: endDate,
          };
        } else {
          return res.status(400).json({ message: 'Invalid month format. Use YYYY-MM' });
        }
      } else {
        return res.status(400).json({ message: 'Invalid month format. Use YYYY-MM' });
      }
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    return res.status(200).json(expenses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Server error fetching expenses' });
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  const { amount, category, date, description } = req.body;

  try {
    // Validations
    if (amount === undefined || amount === null || !category || !date) {
      return res.status(400).json({ message: 'Please provide amount, category, and date' });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ message: 'Expense amount must be a positive number' });
    }

    const expense = await Expense.create({
      amount: Number(amount),
      category,
      date: new Date(date),
      description: description || '',
      userId: req.user._id,
    });

    return res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    return res.status(500).json({ message: error.message || 'Server error creating expense' });
  }
};

// @desc    Update existing expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  const { amount, category, date, description } = req.body;
  const expenseId = req.params.id;

  try {
    // Find expense
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify ownership
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this expense' });
    }

    // Input Validation if fields are updated
    if (amount !== undefined) {
      if (Number(amount) <= 0) {
        return res.status(400).json({ message: 'Expense amount must be a positive number' });
      }
      expense.amount = Number(amount);
    }
    if (category) expense.category = category;
    if (date) expense.date = new Date(date);
    if (description !== undefined) expense.description = description;

    const updatedExpense = await expense.save();
    return res.status(200).json(updatedExpense);
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
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
    // Find expense
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify ownership
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

export default {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
