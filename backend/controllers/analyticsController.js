import Expense from '../models/Expense.js';
import { getPeriodRanges } from '../utils/dateHelper.js';

// ── GET /api/analytics/top-categories?month=YYYY-MM ─────────────
export const topCategories = async (req, res) => {
  try {
    const ranges = getPeriodRanges(req.query);
    const matchCondition = { userId: req.user._id };
    if (ranges.current) {
      matchCondition.date = { $gte: ranges.current.start, $lt: ranges.current.end };
    }

    const result = await Expense.aggregate([
      { $match: matchCondition },
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
    const ranges = getPeriodRanges(req.query);

    const currMatch = { userId: req.user._id };
    if (ranges.current) {
      currMatch.date = { $gte: ranges.current.start, $lt: ranges.current.end };
    }

    const prevMatch = { userId: req.user._id };
    if (ranges.previous) {
      prevMatch.date = { $gte: ranges.previous.start, $lt: ranges.previous.end };
    }

    const [currExp, prevExp] = await Promise.all([
      Expense.find(currMatch),
      Expense.find(prevMatch),
    ]);

    const currTotal = currExp.reduce((s, e) => s + e.amount, 0);
    const prevTotal = prevExp.reduce((s, e) => s + e.amount, 0);

    const change = prevTotal === 0
      ? (currTotal > 0 ? 100 : 0)
      : Math.round(((currTotal - prevTotal) / prevTotal) * 100);

    // Dynamic average calculation based on period type/days
    let periodDays = 30;
    if (ranges.current) {
      const diffMs = ranges.current.end.getTime() - ranges.current.start.getTime();
      periodDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }
    const avgDaily = currTotal / periodDays;

    return res.status(200).json({
      currentMonth:  ranges.periodLabel,
      previousMonth: ranges.prevPeriodLabel,
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
    const ranges = getPeriodRanges(req.query);
    const match = { userId: req.user._id };
    if (ranges.current) {
      match.date = { $gte: ranges.current.start, $lt: ranges.current.end };
    }

    const expenses = await Expense.find(match).sort({ date: 1 });
    const data = [];

    if (!ranges.current) {
      // All time: Group by Year
      const map = {};
      expenses.forEach((e) => {
        const yr = new Date(e.date).getUTCFullYear();
        map[yr] = (map[yr] || 0) + e.amount;
      });
      Object.keys(map).sort().forEach((yr) => {
        data.push({ day: String(yr), total: map[yr] });
      });
    } else if (ranges.type === 'yearly') {
      // Year: Group by Month (12 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const map = {};
      expenses.forEach((e) => {
        const m = new Date(e.date).getUTCMonth(); // 0-11
        map[m] = (map[m] || 0) + e.amount;
      });
      months.forEach((name, idx) => {
        data.push({ day: name, total: map[idx] || 0 });
      });

    } else if (ranges.type === 'monthly') {
      // Month: Group by Day of Month
      const daysInMonth = new Date(
        ranges.current.start.getUTCFullYear(),
        ranges.current.start.getUTCMonth() + 1,
        0
      ).getDate();
      const map = {};
      expenses.forEach((e) => {
        const d = new Date(e.date).getUTCDate();
        map[d] = (map[d] || 0) + e.amount;
      });
      for (let i = 1; i <= daysInMonth; i++) {
        data.push({ day: i, total: map[i] || 0 });
      }
    } else {
      // Custom Range
      const diffMs = ranges.current.end.getTime() - ranges.current.start.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 31) {
        // Group by Day
        const map = {};
        expenses.forEach((e) => {
          const key = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
          map[key] = (map[key] || 0) + e.amount;
        });

        let curr = new Date(ranges.current.start.getTime());
        const last = new Date(ranges.current.end.getTime());
        while (curr < last) {
          const key = curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
          data.push({ day: key, total: map[key] || 0 });
          curr.setUTCDate(curr.getUTCDate() + 1);
        }
      } else if (diffDays <= 180) {
        // Group by Week
        const map = {};
        expenses.forEach((e) => {
          const expTime = new Date(e.date).getTime();
          const wkIdx = Math.floor((expTime - ranges.current.start.getTime()) / (1000 * 60 * 60 * 24 * 7));
          map[wkIdx] = (map[wkIdx] || 0) + e.amount;
        });
        const numWeeks = Math.ceil(diffDays / 7);
        for (let i = 0; i < numWeeks; i++) {
          data.push({ day: `Wk ${i + 1}`, total: map[i] || 0 });
        }
      } else {
        // Group by Month
        const map = {};
        expenses.forEach((e) => {
          const d = new Date(e.date);
          const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
          map[key] = (map[key] || 0) + e.amount;
        });
        let curr = new Date(ranges.current.start.getTime());
        const last = new Date(ranges.current.end.getTime());
        while (curr < last) {
          const key = `${curr.getUTCFullYear()}-${String(curr.getUTCMonth() + 1).padStart(2, '0')}`;
          const label = curr.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
          if (!data.some((d) => d.day === label)) {
            data.push({ day: label, total: map[key] || 0 });
          }
          curr.setUTCMonth(curr.getUTCMonth() + 1);
        }
      }
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
