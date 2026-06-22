import Budget  from '../models/Budget.js';
import Expense from '../models/Expense.js';

// @desc   Create or update a budget for a category/month
// @route  POST /api/budgets
// @access Private
export const upsertBudget = async (req, res) => {
  const { month, category, limit } = req.body;

  if (!month || !category || limit === undefined) {
    return res.status(400).json({ message: 'Please provide month, category, and limit' });
  }
  if (Number(limit) <= 0) {
    return res.status(400).json({ message: 'Budget limit must be greater than 0' });
  }

  // Prevent past budgets
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  if (month < currentMonthStr) {
    return res.status(400).json({ message: 'Budgets cannot be created for past dates.' });
  }

  try {
    // Check if new budget limit is lower than what's already spent in this category and month
    const [year, m] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, m - 1, 1));
    const endDate   = new Date(Date.UTC(year, m, 1));

    const expenses = await Expense.find({
      userId: req.user._id,
      category,
      date: { $gte: startDate, $lt: endDate }
    });

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    if (Number(limit) < totalSpent) {
      return res.status(400).json({ message: 'Budget cannot be less than the amount already spent.' });
    }
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, month, category },
      { limit: Number(limit) },
      { new: true, upsert: true, runValidators: true }
    );
    return res.status(200).json(budget);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// @desc   Get all budgets for a month
// @route  GET /api/budgets?month=YYYY-MM
// @access Private
export const getBudgets = async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'month query param required (YYYY-MM)' });

  try {
    const budgets = await Budget.find({ userId: req.user._id, month });
    return res.status(200).json(budgets);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// @desc   Delete a budget
// @route  DELETE /api/budgets/:id
// @access Private
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    if (budget.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    await budget.deleteOne();
    return res.status(200).json({ message: 'Budget deleted', id: req.params.id });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// @desc   Get spent vs limit per category for a month
// @route  GET /api/budgets/status?month=YYYY-MM
// @access Private
export const getBudgetStatus = async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'month query param required (YYYY-MM)' });

  try {
    const [year, m] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, m - 1, 1));
    const endDate   = new Date(Date.UTC(year, m, 1));

    // Fetch budgets and expenses for the month in parallel
    const [budgets, expenses] = await Promise.all([
      Budget.find({ userId: req.user._id, month }),
      Expense.find({ userId: req.user._id, date: { $gte: startDate, $lt: endDate } }),
    ]);

    // Sum spending per category
    const spent = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    // Build status array
    const status = budgets.map((b) => ({
      _id:      b._id,
      category: b.category,
      limit:    b.limit,
      spent:    spent[b.category] || 0,
      percent:  Math.round(((spent[b.category] || 0) / b.limit) * 100),
    }));

    return res.status(200).json(status);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};
