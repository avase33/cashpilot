import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import { requireAuth, requireOrgAccess, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireOrgAccess);

// GET /api/transactions
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['income', 'expense', 'transfer']),
  query('account').optional().isMongoId(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('category').optional().isString(),
  query('search').optional().isString(),
], async (req, res, next) => {
  try {
    const { page = 1, limit = 50, type, account, startDate, endDate, category, search } = req.query;
    const filter = { org: req.org._id };
    if (type) filter.type = type;
    if (account) filter.account = account;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) filter.description = { $regex: search, $options: 'i' };

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate('account', 'name color type')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ transactions, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// POST /api/transactions
router.post('/', requireRole('owner', 'admin', 'accountant'), [
  body('account').isMongoId(),
  body('type').isIn(['income', 'expense', 'transfer']),
  body('amount').isFloat({ min: 0.01 }),
  body('description').trim().notEmpty(),
  body('date').optional().isISO8601(),
  body('category').optional().isString(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { account: accountId, type, amount, description, date, category, tags, notes, reference, transferToAccount } = req.body;

    const account = await Account.findOne({ _id: accountId, org: req.org._id });
    if (!account) return res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });

    const tx = await Transaction.create({
      org: req.org._id,
      account: accountId,
      type, amount: Number(amount), description,
      date: date ? new Date(date) : new Date(),
      category: category || (type === 'income' ? 'revenue' : 'other_expense'),
      tags, notes, reference,
      transferToAccount,
      createdBy: req.user._id,
    });

    // Update account balance
    if (type === 'income') account.balance += Number(amount);
    else if (type === 'expense') account.balance -= Number(amount);
    else if (type === 'transfer' && transferToAccount) {
      account.balance -= Number(amount);
      await Account.findByIdAndUpdate(transferToAccount, { $inc: { balance: Number(amount) } });
    }
    await account.save();

    await tx.populate('account', 'name color type');
    res.status(201).json(tx);
  } catch (err) { next(err); }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, org: req.org._id })
      .populate('account', 'name color type');
    if (!tx) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(tx);
  } catch (err) { next(err); }
});

// PATCH /api/transactions/:id
router.patch('/:id', requireRole('owner', 'admin', 'accountant'), async (req, res, next) => {
  try {
    const allowed = ['description', 'category', 'subcategory', 'tags', 'notes', 'reference', 'date'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const tx = await Transaction.findOneAndUpdate(
      { _id: req.params.id, org: req.org._id },
      updates, { new: true }
    ).populate('account', 'name color type');
    if (!tx) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(tx);
  } catch (err) { next(err); }
});

// DELETE /api/transactions/:id
router.delete('/:id', requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const tx = await Transaction.findOneAndDelete({ _id: req.params.id, org: req.org._id });
    if (!tx) return res.status(404).json({ error: 'NOT_FOUND' });
    // Reverse balance impact
    const account = await Account.findById(tx.account);
    if (account) {
      if (tx.type === 'income') account.balance -= tx.amount;
      else if (tx.type === 'expense') account.balance += tx.amount;
      await account.save();
    }
    res.json({ message: 'Transaction deleted' });
  } catch (err) { next(err); }
});

export default router;
