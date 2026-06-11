import cron from 'node-cron';
import Expense from '../models/Expense.js';

// Advance date by interval
const advanceDate = (date, interval) => {
  const d = new Date(date);
  if (interval === 'monthly') d.setMonth(d.getMonth() + 1);
  if (interval === 'weekly')  d.setDate(d.getDate() + 7);
  if (interval === 'yearly')  d.setFullYear(d.getFullYear() + 1);
  return d;
};

export const startRecurringJob = () => {
  // Runs at 00:05 on the 1st of every month
  cron.schedule('5 0 1 * *', async () => {
    console.log('[Cron] Running recurring expense job...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Find all recurring expenses whose nextDueDate is today or in the past
      const due = await Expense.find({
        isRecurring: true,
        nextDueDate: { $lte: today },
      });

      console.log(`[Cron] Found ${due.length} recurring expense(s) to process`);

      for (const source of due) {
        const dueDate = new Date(source.nextDueDate);

        // Duplicate check: same user + category + amount + same month
        const startOfMonth = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), 1));
        const endOfMonth   = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth() + 1, 1));

        const exists = await Expense.findOne({
          userId:   source.userId,
          category: source.category,
          amount:   source.amount,
          date:     { $gte: startOfMonth, $lt: endOfMonth },
          _id:      { $ne: source._id },   // not itself
        });

        if (!exists) {
          // Create new expense for the due period
          await Expense.create({
            userId:             source.userId,
            amount:             source.amount,
            category:           source.category,
            date:               dueDate,
            description:        source.description,
            isRecurring:        true,
            recurrenceInterval: source.recurrenceInterval,
          });
          console.log(`[Cron] Created recurring expense: ${source.category} ₹${source.amount}`);
        } else {
          console.log(`[Cron] Skipped duplicate: ${source.category} ₹${source.amount}`);
        }

        // Advance nextDueDate on the source expense
        source.nextDueDate = advanceDate(source.nextDueDate, source.recurrenceInterval);
        await source.save({ validateBeforeSave: false });
      }

      console.log('[Cron] Recurring job complete.');
    } catch (err) {
      console.error('[Cron] Error in recurring job:', err.message);
    }
  });

  console.log('[Cron] Recurring expense job scheduled (1st of every month at 00:05)');
};
