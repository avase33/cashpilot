// Invoice routes -- 2026-07-22 18:03:18
import { Router, Request, Response } from 'express';
import { Invoice } from '../models/Invoice';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(100);
    res.json({ invoices, count: invoices.length });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch invoices' }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch invoice' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) { res.status(400).json({ error: 'Failed to create invoice' }); }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) { res.status(400).json({ error: 'Failed to update invoice' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: 'Failed to delete invoice' }); }
});

export default router;