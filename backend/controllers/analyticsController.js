import Expense from '../models/Expense.js';

// Helper: date range for a YYYY-MM string
const monthRange = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end:   new Date(Date.UTC(y, m, 1)),
  };
};

// Helper: previous month string
const prevMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

// ── GET /api/analytics/top-categories?month=YYYY-MM ─────────────
export const topCategories = async (req, res) => {
  try {
    const month = req.query.month || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const { start, end } = monthRange(month);

    const result = await Expense.aggregate([
      { $match: { userId: req.user._id, date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 3 },
      { $project: { category: '$_id', total: 1, count: 1, _id: 0 } },
    ]);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── GET /api/analytics/monthly-compare?month=YYYY-MM ────────────
export const monthlyCompare = async (req, res) => {
  try {
    const month = req.query.month || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const prev               = prevMonth(month);
    const { start: cs, end: ce } = monthRange(month);
    const { start: ps, end: pe } = monthRange(prev);

    const [currExp, prevExp] = await Promise.all([
      Expense.find({ userId: req.user._id, date: { $gte: cs, $lt: ce } }),
      Expense.find({ userId: req.user._id, date: { $gte: ps, $lt: pe } }),
    ]);

    const currTotal = currExp.reduce((s, e) => s + e.amount, 0);
    const prevTotal = prevExp.reduce((s, e) => s + e.amount, 0);

    const change = prevTotal === 0
      ? (currTotal > 0 ? 100 : 0)
      : Math.round(((currTotal - prevTotal) / prevTotal) * 100);

    // Days in current month for average
    const [y, m] = month.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const avgDaily    = currTotal / daysInMonth;

    return res.status(200).json({
      currentMonth:  month,
      previousMonth: prev,
      currentTotal:  currTotal,
      previousTotal: prevTotal,
      changePercent: change,
      avgDailySpend: avgDaily,
      currentCount:  currExp.length,
      previousCount: prevExp.length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── GET /api/analytics/daily-breakdown?month=YYYY-MM ────────────
export const dailyBreakdown = async (req, res) => {
  try {
    const month = req.query.month || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const { start, end } = monthRange(month);
    const [y, m]         = month.split('-').map(Number);
    const daysInMonth    = new Date(y, m, 0).getDate();

    const expenses = await Expense.find({
      userId: req.user._id,
      date:   { $gte: start, $lt: end },
    });

    // Build a map day → total
    const map = {};
    expenses.forEach((e) => {
      const day = new Date(e.date).getUTCDate();
      map[day]  = (map[day] || 0) + e.amount;
    });

    // Fill all days (0 if no expense)
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      day:   i + 1,
      total: map[i + 1] || 0,
    }));

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
