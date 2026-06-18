import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Invoice from '../models/Invoice.js';
import { requireAuth, requireOrgAccess, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireOrgAccess);

async function getNextInvoiceNumber(orgId) {
  const last = await Invoice.findOne({ org: orgId }).sort({ createdAt: -1 }).select('invoiceNumber');
  if (!last) return 'INV-0001';
  const n = parseInt(last.invoiceNumber.replace(/\D/g, '')) + 1;
  return `INV-${String(n).padStart(4, '0')}`;
}

// GET /api/invoices
router.get('/', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { org: req.org._id };
    if (status) filter.status = status;
    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    // Summary stats
    const all = await Invoice.find({ org: req.org._id });
    const stats = {
      totalOutstanding: all.filter(i => ['sent', 'viewed', 'partial'].includes(i.status)).reduce((s, i) => s + i.amountDue, 0),
      totalOverdue: all.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amountDue, 0),
      totalPaidThisMonth: all.filter(i => i.status === 'paid' && i.paidDate >= new Date(new Date().setDate(1))).reduce((s, i) => s + i.total, 0),
      countDraft: all.filter(i => i.status === 'draft').length,
      countOverdue: all.filter(i => i.status === 'overdue').length,
    };
    res.json({ invoices, total, stats, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// POST /api/invoices
router.post('/', requireRole('owner', 'admin', 'accountant'), [
  body('client.name').trim().notEmpty(),
  body('dueDate').isISO8601(),
  body('lineItems').isArray({ min: 1 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const invoiceNumber = await getNextInvoiceNumber(req.org._id);
    const { client, lineItems, dueDate, issueDate, notes, terms, currency, linkedAccount } = req.body;

    const processedItems = lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate || 0,
      amount: (item.quantity || 1) * item.unitPrice,
    }));

    const invoice = await Invoice.create({
      org: req.org._id,
      invoiceNumber,
      client,
      lineItems: processedItems,
      dueDate: new Date(dueDate),
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      notes, terms,
      currency: currency || req.org.currency,
      linkedAccount,
      createdBy: req.user._id,
    });

    res.status(201).json(invoice);
  } catch (err) { next(err); }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, org: req.org._id });
    if (!invoice) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(invoice);
  } catch (err) { next(err); }
});

// PATCH /api/invoices/:id
router.patch('/:id', requireRole('owner', 'admin', 'accountant'), async (req, res, next) => {
  try {
    const allowed = ['status', 'client', 'lineItems', 'dueDate', 'notes', 'terms', 'amountPaid', 'paidDate'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.lineItems) {
      updates.lineItems = updates.lineItems.map(item => ({
        ...item,
        amount: (item.quantity || 1) * item.unitPrice,
      }));
    }
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, org: req.org._id },
      updates, { new: true, runValidators: true }
    );
    if (!invoice) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(invoice);
  } catch (err) { next(err); }
});

// POST /api/invoices/:id/mark-paid
router.post('/:id/mark-paid', requireRole('owner', 'admin', 'accountant'), async (req, res, next) => {
  try {
    const { amountPaid, paidDate } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.id, org: req.org._id });
    if (!invoice) return res.status(404).json({ error: 'NOT_FOUND' });
    invoice.amountPaid = amountPaid || invoice.total;
    invoice.paidDate = paidDate ? new Date(paidDate) : new Date();
    invoice.status = 'paid';
    await invoice.save();
    res.json(invoice);
  } catch (err) { next(err); }
});

// DELETE /api/invoices/:id
router.delete('/:id', requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, org: req.org._id });
    if (!invoice) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ message: 'Invoice deleted' });
  } catch (err) { next(err); }
});

export default router;
