import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import { getPeriodRanges } from '../utils/dateHelper.js';

// ── Helpers ─────────────────────────────────────────────────────
const fetchFiltered = async (userId, query) => {
  const { category } = query;
  const dbQuery = { userId };
  if (category) dbQuery.category = category;
  
  const ranges = getPeriodRanges(query);
  if (ranges.current) {
    dbQuery.date = {
      $gte: ranges.current.start,
      $lt:  ranges.current.end,
    };
  }
  return Expense.find(dbQuery).sort({ date: -1 });
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtAmt = (n) =>
  `Rs.${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ── CSV Export ───────────────────────────────────────────────────
export const exportCSV = async (req, res) => {
  try {
    const expenses = await fetchFiltered(req.user._id, req.query);
    if (!expenses.length)
      return res.status(404).json({ message: 'No expenses found for the selected filters.' });

    const rows = expenses.map((e) => ({
      Date:        fmtDate(e.date),
      Category:    e.category,
      Amount:      Number(e.amount).toFixed(2),
      Description: e.description || '',
      Recurring:   e.isRecurring ? e.recurrenceInterval : 'No',
    }));

    const ranges = getPeriodRanges(req.query);
    const parser = new Parser({ fields: ['Date', 'Category', 'Amount', 'Description', 'Recurring'] });
    const csv    = parser.parse(rows);
    const filename = `spendwise-expenses-${ranges.periodLabel.toLowerCase().replace(/[^a-z0-9]/g, '-')}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to export CSV' });
  }
};

// ── PDF Export ───────────────────────────────────────────────────
export const exportPDF = async (req, res) => {
  try {
    const [expenses, user] = await Promise.all([
      fetchFiltered(req.user._id, req.query),
      User.findById(req.user._id).select('name email'),
    ]);

    if (!expenses.length)
      return res.status(404).json({ message: 'No expenses found for the selected filters.' });

    const total     = expenses.reduce((s, e) => s + e.amount, 0);
    const byCat     = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    const sortedCat = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

    const ranges = getPeriodRanges(req.query);
    const filename = `spendwise-expenses-${ranges.periodLabel.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const W      = doc.page.width   // 595
    const LEFT   = 50
    const RIGHT  = W - 50           // 545
    const INNER  = RIGHT - LEFT     // 495

    doc.pipe(res);

    // ══════════════════════════════════════════
    // HEADER
    // ══════════════════════════════════════════
    doc.rect(0, 0, W, 72).fill('#4a7c59');
    doc.fontSize(20).fillColor('#ffffff').font('Helvetica-Bold')
       .text('Spendwise', LEFT, 20);
    doc.fontSize(10).fillColor('#c8dcd0').font('Helvetica')
       .text('Expense Report', LEFT, 46);
    // right-align export date in header
    doc.fontSize(9).fillColor('#c8dcd0')
       .text(`Exported: ${fmtDate(new Date())}`, 0, 28,
             { align: 'right', width: W - 50 });

    // ══════════════════════════════════════════
    // META INFO BOX
    // ══════════════════════════════════════════
    let y = 84;
    doc.rect(LEFT, y, INNER, 68).fill('#f5f4f0');

    const metaRows = [
      ['Name',   user.name],
      ['Email',  user.email],
      ['Period', ranges.periodLabel],
      ['Total',  fmtAmt(total)],
    ];
    metaRows.forEach(([label, value], i) => {
      const my = y + 8 + i * 14;
      doc.fontSize(8).fillColor('#7a7670').font('Helvetica')
         .text(label, LEFT + 10, my);
      const isTotal = label === 'Total';
      doc.fontSize(isTotal ? 10 : 9)
         .fillColor(isTotal ? '#4a7c59' : '#0f0e0c')
         .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
         .text(value, LEFT + 70, my);
    });

    y += 78;

    // ══════════════════════════════════════════
    // CATEGORY BREAKDOWN
    // ══════════════════════════════════════════
    doc.fontSize(11).fillColor('#0f0e0c').font('Helvetica-Bold')
       .text('Category Breakdown', LEFT, y);
    y += 16;

    // Column positions — fixed, no overlap
    const COL_CAT  = LEFT          // category name  x=50,  width=120
    const COL_BAR  = LEFT + 125    // bar start       x=175, width=240
    const COL_AMT  = LEFT + 370    // amount          x=420, width=80
    const COL_PCT  = LEFT + 455    // percent         x=505, width=40

    const BAR_MAX  = 240
    const BAR_H    = 10

    sortedCat.forEach(([cat, amt]) => {
      const pct  = Math.round((amt / total) * 100)
      const barW = Math.round((amt / total) * BAR_MAX)

      // Category label — fixed width so it never bleeds into bar
      doc.fontSize(8.5).font('Helvetica').fillColor('#2e2c27')
         .text(cat, COL_CAT, y + 1, { width: 120, ellipsis: true })

      // Background bar
      doc.rect(COL_BAR, y, BAR_MAX, BAR_H).fill('#e8e6df')
      // Filled bar
      if (barW > 0) doc.rect(COL_BAR, y, barW, BAR_H).fill('#4a7c59')

      // Amount — right-aligned in its column
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f0e0c')
         .text(fmtAmt(amt), COL_AMT, y + 1, { width: 80, align: 'right' })

      // Percent — right-aligned
      doc.fontSize(8).font('Helvetica').fillColor('#7a7670')
         .text(`(${pct}%)`, COL_PCT, y + 1, { width: 38, align: 'right' })

      y += 18
    })

    // Divider
    y += 4
    doc.moveTo(LEFT, y).lineTo(RIGHT, y).strokeColor('#e8e6df').lineWidth(0.5).stroke()
    y += 14

    // ══════════════════════════════════════════
    // EXPENSE TABLE
    // ══════════════════════════════════════════
    doc.fontSize(11).fillColor('#0f0e0c').font('Helvetica-Bold')
       .text('All Expenses', LEFT, y)
    y += 14

    // Table columns
    const T = {
      date: { x: LEFT,       w: 75  },
      cat:  { x: LEFT + 78,  w: 95  },
      desc: { x: LEFT + 176, w: 185 },
      amt:  { x: LEFT + 364, w: 130 },  // right-aligned
    }

    // Header row
    doc.rect(LEFT, y, INNER, 18).fill('#4a7c59')
    doc.fontSize(8.5).fillColor('#ffffff').font('Helvetica-Bold')
    doc.text('Date',        T.date.x + 3, y + 4, { width: T.date.w })
    doc.text('Category',    T.cat.x  + 3, y + 4, { width: T.cat.w  })
    doc.text('Description', T.desc.x + 3, y + 4, { width: T.desc.w })
    doc.text('Amount',      T.amt.x,      y + 4, { width: T.amt.w, align: 'right' })
    y += 18

    // Data rows
    expenses.forEach((e, i) => {
      // New page if near bottom
      if (y > doc.page.height - 70) {
        doc.addPage()
        y = 50

        // Re-draw header on new page
        doc.rect(LEFT, y, INNER, 18).fill('#4a7c59')
        doc.fontSize(8.5).fillColor('#ffffff').font('Helvetica-Bold')
        doc.text('Date',        T.date.x + 3, y + 4, { width: T.date.w })
        doc.text('Category',    T.cat.x  + 3, y + 4, { width: T.cat.w  })
        doc.text('Description', T.desc.x + 3, y + 4, { width: T.desc.w })
        doc.text('Amount',      T.amt.x,      y + 4, { width: T.amt.w, align: 'right' })
        y += 18
      }

      const rowH = 17
      const bg   = i % 2 === 0 ? '#f9f8f6' : '#ffffff'
      doc.rect(LEFT, y, INNER, rowH).fill(bg)

      // Left border accent for recurring
      if (e.isRecurring) {
        doc.rect(LEFT, y, 3, rowH).fill('#4a7c59')
      }

      doc.fontSize(8).fillColor('#0f0e0c').font('Helvetica')
      doc.text(fmtDate(e.date),              T.date.x + 3, y + 4, { width: T.date.w })
      doc.text(e.category,                   T.cat.x  + 3, y + 4, { width: T.cat.w,  ellipsis: true })
      doc.text(e.description || '-',         T.desc.x + 3, y + 4, { width: T.desc.w, ellipsis: true })
      doc.font('Helvetica-Bold')
         .text(fmtAmt(e.amount),             T.amt.x,      y + 4, { width: T.amt.w,  align: 'right' })

      y += rowH
    })

    // Total row
    doc.rect(LEFT, y, INNER, 18).fill('#4a7c59')
    doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold')
    doc.text('TOTAL', T.desc.x + 3, y + 4, { width: T.desc.w })
    doc.text(fmtAmt(total), T.amt.x, y + 4, { width: T.amt.w, align: 'right' })
    y += 18

    // ══════════════════════════════════════════
    // FOOTER
    // ══════════════════════════════════════════
    const footerY = doc.page.height - 36
    doc.rect(0, footerY, W, 36).fill('#f5f4f0')
    doc.fontSize(7.5).fillColor('#9ca3af').font('Helvetica')
       .text(
         `Generated by Spendwise  •  ${new Date().toLocaleString('en-IN')}  •  ${expenses.length} transaction(s)`,
         0, footerY + 12,
         { align: 'center', width: W }
       )

    doc.end()
  } catch (err) {
    console.error(err)
    if (!res.headersSent)
      return res.status(500).json({ message: err.message || 'Failed to export PDF' })
  }
}
