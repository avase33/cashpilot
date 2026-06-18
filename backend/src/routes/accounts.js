import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import { requireAuth, requireOrgAccess, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireOrgAccess);

// GET /api/accounts
router.get('/', async (req, res, next) => {
  try {
    const accounts = await Account.find({ org: req.org._id, isActive: true }).sort({ createdAt: 1 });
    const totalBalance = accounts.filter(a => a.includeInTotal).reduce((s, a) => s + a.balance, 0);
    res.json({ accounts, totalBalance });
  } catch (err) { next(err); }
});

// POST /api/accounts
router.post('/', requireRole('owner', 'admin', 'accountant'), [
  body('name').trim().notEmpty(),
  body('type').isIn(['checking', 'savings', 'credit', 'investment', 'cash', 'crypto', 'other']),
  body('initialBalance').optional().isNumeric(),
  body('currency').optional().isLength({ min: 3, max: 3 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, type, initialBalance = 0, currency, institution, accountNumber, color, icon, notes } = req.body;
    const account = await Account.create({
      org: req.org._id,
      name, type,
      balance: initialBalance,
      initialBalance,
      currency: currency || req.org.currency,
      institution, accountNumber, color, icon, notes,
    });
    res.status(201).json(account);
  } catch (err) { next(err); }
});

// GET /api/accounts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, org: req.org._id });
    if (!account) return res.status(404).json({ error: 'NOT_FOUND' });
    // Recent transactions
    const recentTx = await Transaction.find({ account: account._id, org: req.org._id })
      .sort({ date: -1 }).limit(20);
    res.json({ account, recentTransactions: recentTx });
  } catch (err) { next(err); }
});

// PATCH /api/accounts/:id
router.patch('/:id', requireRole('owner', 'admin', 'accountant'), async (req, res, next) => {
  try {
    const allowed = ['name', 'institution', 'accountNumber', 'color', 'icon', 'notes', 'includeInTotal'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, org: req.org._id },
      updates, { new: true }
    );
    if (!account) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(account);
  } catch (err) { next(err); }
});

// DELETE /api/accounts/:id (soft delete)
router.delete('/:id', requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, org: req.org._id },
      { isActive: false }, { new: true }
    );
    if (!account) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ message: 'Account archived' });
  } catch (err) { next(err); }
});

export default router;
