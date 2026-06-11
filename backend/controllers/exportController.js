import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import Expense from '../models/Expense.js';
import User from '../models/User.js';

// ── shared: build query & fetch expenses ────────────────────────
const fetchFiltered = async (userId, query) => {
  const { month, category } = query;
  const dbQuery = { userId };

  if (category) dbQuery.category = category;

  if (month) {
    const [year, m] = month.split('-').map(Number);
    if (!isNaN(year) && !isNaN(m) && m >= 1 && m <= 12) {
      dbQuery.date = {
        $gte: new Date(Date.UTC(year, m - 1, 1)),
        $lt:  new Date(Date.UTC(year, m, 1)),
      };
    }
  }

  return Expense.find(dbQuery).sort({ date: -1 });
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtAmt = (n) =>
  `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ── CSV Export ──────────────────────────────────────────────────
// GET /api/expenses/export/csv
export const exportCSV = async (req, res) => {
  try {
    const expenses = await fetchFiltered(req.user._id, req.query);
    if (!expenses.length) {
      return res.status(404).json({ message: 'No expenses found for the selected filters.' });
    }

    const rows = expenses.map((e) => ({
      Date:        fmtDate(e.date),
      Category:    e.category,
      Amount:      Number(e.amount).toFixed(2),
      Description: e.description || '',
      Recurring:   e.isRecurring ? e.recurrenceInterval : 'No',
    }));

    const parser = new Parser({ fields: ['Date', 'Category', 'Amount', 'Description', 'Recurring'] });
    const csv    = parser.parse(rows);

    const filename = `spendwise-expenses-${req.query.month || 'all'}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to export CSV' });
  }
};

// ── PDF Export ──────────────────────────────────────────────────
// GET /api/expenses/export/pdf
export const exportPDF = async (req, res) => {
  try {
    const [expenses, user] = await Promise.all([
      fetchFiltered(req.user._id, req.query),
      User.findById(req.user._id).select('name email'),
    ]);

    if (!expenses.length) {
      return res.status(404).json({ message: 'No expenses found for the selected filters.' });
    }

    const total     = expenses.reduce((s, e) => s + e.amount, 0);
    const byCat     = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    const sortedCat = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

    const filename = `spendwise-expenses-${req.query.month || 'all'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // ── Header bar ──
    doc.rect(0, 0, doc.page.width, 70).fill('#4a7c59');
    doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
      .text('Spendwise', 50, 22);
    doc.fontSize(10).fillColor('#c8dcd0').font('Helvetica')
      .text('Expense Report', 50, 48);

    // ── Meta info ──
    doc.fillColor('#0f0e0c').fontSize(10).font('Helvetica');
    let y = 90;
    doc.text(`Name:`,         50,  y).font('Helvetica-Bold').text(user.name,   130, y);
    doc.font('Helvetica').text(`Email:`,        50, y + 16).font('Helvetica-Bold').text(user.email,  130, y + 16);
    doc.font('Helvetica').text(`Period:`,       50, y + 32).font('Helvetica-Bold')
      .text(req.query.month || 'All time', 130, y + 32);
    doc.font('Helvetica').text(`Exported on:`,  50, y + 48).font('Helvetica-Bold')
      .text(fmtDate(new Date()), 130, y + 48);
    doc.font('Helvetica').text(`Total:`,        50, y + 64).font('Helvetica-Bold')
      .fontSize(12).fillColor('#4a7c59').text(fmtAmt(total), 130, y + 64);

    // ── Divider ──
    doc.moveTo(50, y + 88).lineTo(545, y + 88).strokeColor('#e8e6df').lineWidth(1).stroke();

    // ── Category Breakdown ──
    y += 100;
    doc.fontSize(12).fillColor('#0f0e0c').font('Helvetica-Bold').text('Category Breakdown', 50, y);
    y += 18;

    sortedCat.forEach(([cat, amt]) => {
      const pct   = Math.round((amt / total) * 100);
      const barW  = Math.round((amt / total) * 300);
      doc.fontSize(9).font('Helvetica').fillColor('#4a4740').text(cat, 50, y + 3);
      doc.rect(180, y, 300, 12).fillColor('#e8e6df').fill();
      doc.rect(180, y, barW, 12).fillColor('#4a7c59').fill();
      doc.fillColor('#0f0e0c').font('Helvetica-Bold')
        .text(`${fmtAmt(amt)}  (${pct}%)`, 490, y + 2, { align: 'right', width: 55 });
      y += 20;
    });

    // ── Divider ──
    doc.moveTo(50, y + 6).lineTo(545, y + 6).strokeColor('#e8e6df').lineWidth(1).stroke();
    y += 20;

    // ── Expense Table header ──
    doc.fontSize(12).fillColor('#0f0e0c').font('Helvetica-Bold').text('All Expenses', 50, y);
    y += 18;

    // Table header row
    doc.rect(50, y, 495, 20).fillColor('#4a7c59').fill();
    doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold');
    doc.text('Date',        55,  y + 5);
    doc.text('Category',    130, y + 5);
    doc.text('Description', 255, y + 5);
    doc.text('Amount',      460, y + 5, { align: 'right', width: 80 });
    y += 20;

    // Table rows
    expenses.forEach((e, i) => {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 50;
      }
      const bg = i % 2 === 0 ? '#f5f4f0' : '#ffffff';
      doc.rect(50, y, 495, 18).fillColor(bg).fill();
      doc.fontSize(8).fillColor('#0f0e0c').font('Helvetica');
      doc.text(fmtDate(e.date),            55,  y + 4);
      doc.text(e.category,                 130, y + 4);
      doc.text((e.description || '-').substring(0, 28), 255, y + 4);
      doc.font('Helvetica-Bold')
        .text(fmtAmt(e.amount),            460, y + 4, { align: 'right', width: 80 });
      y += 18;
    });

    // ── Footer ──
    const footerY = doc.page.height - 40;
    doc.rect(0, footerY, doc.page.width, 40).fillColor('#f5f4f0').fill();
    doc.fontSize(8).fillColor('#7a7670').font('Helvetica')
      .text(`Generated by Spendwise • ${new Date().toISOString()}`, 50, footerY + 14,
        { align: 'center', width: doc.page.width - 100 });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      return res.status(500).json({ message: err.message || 'Failed to export PDF' });
    }
  }
};
