import { Router } from 'express';
import { requireAuth, requireOrgAccess } from '../middleware/auth.js';
import { generateForecast } from '../services/forecastService.js';

const router = Router();
router.use(requireAuth, requireOrgAccess);

// GET /api/forecast?days=90
router.get('/', async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days || '90', 10), 365);
    const forecast = await generateForecast(req.org._id, days);
    res.json(forecast);
  } catch (err) { next(err); }
});

export default router;
