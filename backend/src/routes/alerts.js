import { Router } from 'express';
import Alert from '../models/Alert.js';
import { requireAuth, requireOrgAccess } from '../middleware/auth.js';
import { runAlertChecks } from '../services/alertService.js';

const router = Router();
router.use(requireAuth, requireOrgAccess);

// GET /api/alerts
router.get('/', async (req, res, next) => {
  try {
    const { isRead, isResolved = false, page = 1, limit = 30 } = req.query;
    const filter = { org: req.org._id };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (isResolved !== undefined) filter.isResolved = isResolved === 'true';
    const total = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const unreadCount = await Alert.countDocuments({ org: req.org._id, isRead: false, isResolved: false });
    res.json({ alerts, total, unreadCount, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// POST /api/alerts/run-checks — trigger alert evaluation
router.post('/run-checks', async (req, res, next) => {
  try {
    await runAlertChecks(req.org._id);
    res.json({ message: 'Alert checks completed' });
  } catch (err) { next(err); }
});

// PATCH /api/alerts/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, org: req.org._id },
      { isRead: true }, { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(alert);
  } catch (err) { next(err); }
});

// PATCH /api/alerts/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await Alert.updateMany({ org: req.org._id, isRead: false }, { isRead: true });
    res.json({ message: 'All alerts marked as read' });
  } catch (err) { next(err); }
});

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, org: req.org._id },
      { isResolved: true, resolvedAt: new Date(), isRead: true }, { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(alert);
  } catch (err) { next(err); }
});

export default router;
