import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../services/tokenService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('orgName').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password, orgName } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'EMAIL_EXISTS', message: 'Email already registered' });

    const user = new User({ name, email, passwordHash: password });
    await user.save();

    // Create default organization
    const org = await Organization.create({
      name: orgName || `${name}'s Organization`,
      members: [{ user: user._id, role: 'owner' }],
    });
    user.orgs = [org._id];
    user.activeOrg = org._id;
    await user.save();

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    res.status(201).json({ accessToken, refreshToken, user, org });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    res.json({ accessToken, refreshToken, user });
  } catch (err) { next(err); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'NO_TOKEN' });
    let payload;
    try { payload = verifyRefreshToken(refreshToken); }
    catch { return res.status(401).json({ error: 'INVALID_REFRESH_TOKEN' }); }
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'USER_NOT_FOUND' });
    res.json({ accessToken: signAccessToken(user._id) });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => res.json(req.user));

// PATCH /api/auth/me
router.patch('/me', requireAuth, [
  body('name').optional().trim().notEmpty(),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('timezone').optional().trim(),
], async (req, res, next) => {
  try {
    const { name, currency, timezone, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (currency) updates.currency = currency;
    if (timezone) updates.timezone = timezone;
    if (avatar !== undefined) updates.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (err) { next(err); }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ error: 'WRONG_PASSWORD', message: 'Current password is incorrect' });
    }
    user.passwordHash = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});

export default router;
