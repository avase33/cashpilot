import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Bill from '../models/Bill.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import { requireAuth, requireOrgAccess, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireOrgAccess);

// GET /api/bills
router.get('/', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { org: req.org._id };
    if (status) filter.status = status;
    const total = await Bill.countDocuments(filter);
    const bills = await Bill.find(filter).sort({ dueDate: 1 }).skip((page - 1) * limit).limit(Number(limit));

    const upcoming = await Bill.find({
      org: req.org._id,
      status: { $in: ['pending', 'scheduled'] },
      dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 30 * 86400000) },
    });
    const stats = {
      totalUpcoming30Days: upcoming.reduce((s, b) => s + b.amount, 0),
      countUpcoming: upcoming.length,
      countOverdue: await Bill.countDocuments({ org: req.org._id, status: 'overdue' }),
    };

    res.json({ bills, total, stats, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// POST /api/bills
router.post('/', requireRole('owner', 'admin', 'accountant'), [
  body('vendor').trim().notEmpty(),
  body('amount').isFloat({ min: 0.01 }),
  body('dueDate').isISO8601(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { vendor, amount, dueDate, category, currency, description, isRecurring, recurrence, linkedAccount } = req.body;
    const bill = await Bill.create({
      org: req.org._id,
      vendor, amount: Number(amount),
      dueDate: new Date(dueDate),
      category: category || 'other_expense',
      currency: currency || req.org.currency,
      description, isRecurring, recurrence, linkedAccount,
      createdBy: req.user._id,
    });
    res.status(201).json(bill);
  } catch (err) { next(err); }
});

// PATCH /api/bills/:id
router.patch('/:id', requireRole('owner', 'admin', 'accountant'), async (req, res, next) => {
  try {
    const allowed = ['vendor', 'amount', 'dueDate', 'category', 'description', 'status', 'isRecurring', 'recurrence'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const bill = await Bill.findOneAndUpdate({ _id: req.params.id, org: req.org._id }, updates, { new: true });
    if (!bill) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(bill);
  } catch (err) { next(err); }
});

// POST /api/bills/:id/pay
router.post('/:id/pay', requireRole('owner', 'admin', 'accountant'), async (req, res, next) => {
  try {
    const { accountId, paidDate } = req.body;
    const bill = await Bill.findOne({ _id: req.params.id, org: req.org._id });
    if (!bill) return res.status(404).json({ error: 'NOT_FOUND' });

    bill.status = 'paid';
    bill.paidDate = paidDate ? new Date(paidDate) : new Date();
    await bill.save();

    // Create expense transaction if account provided
    if (accountId) {
      const account = await Account.findOne({ _id: accountId, org: req.org._id });
      if (account) {
        await Transaction.create({
          org: req.org._id, account: accountId,
          type: 'expense', amount: bill.amount,
          description: `Bill payment: ${bill.vendor}`,
          date: bill.paidDate,
          category: bill.category,
          linkedBill: bill._id,
          createdBy: req.user._id,
        });
        account.balance -= bill.amount;
        await account.save();
      }
    }

    // Schedule next recurring bill
    if (bill.isRecurring && bill.recurrence?.frequency) {
      const next = new Date(bill.dueDate);
      const freq = bill.recurrence.frequency;
      if (freq === 'weekly') next.setDate(next.getDate() + 7);
      else if (freq === 'biweekly') next.setDate(next.getDate() + 14);
      else if (freq === 'monthly') next.setMonth(next.getMonth() + 1);
      else if (freq === 'quarterly') next.setMonth(next.getMonth() + 3);
      else if (freq === 'yearly') next.setFullYear(next.getFullYear() + 1);

      if (!bill.recurrence.endDate || next <= new Date(bill.recurrence.endDate)) {
        await Bill.create({
          org: req.org._id,
          vendor: bill.vendor, amount: bill.amount,
          dueDate: next,
          category: bill.category,
          currency: bill.currency,
          description: bill.description,
          isRecurring: true, recurrence: bill.recurrence,
          linkedAccount: bill.linkedAccount,
        });
      }
    }

    res.json(bill);
  } catch (err) { next(err); }
});

// DELETE /api/bills/:id
router.delete('/:id', requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const bill = await Bill.findOneAndDelete({ _id: req.params.id, org: req.org._id });
    if (!bill) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ message: 'Bill deleted' });
  } catch (err) { next(err); }
});

export default router;
