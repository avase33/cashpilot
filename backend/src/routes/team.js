import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { requireAuth, requireOrgAccess, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireOrgAccess);

// GET /api/team — list members
router.get('/', async (req, res, next) => {
  try {
    const org = await Organization.findById(req.org._id).populate('members.user', 'name email avatar');
    res.json({ members: org.members, orgName: org.name, plan: org.plan });
  } catch (err) { next(err); }
});

// POST /api/team/invite — invite by email
router.post('/invite', requireRole('owner', 'admin'), [
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'accountant', 'viewer']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'No account found with that email. Ask them to register first.' });

    const org = await Organization.findById(req.org._id);
    const already = org.members.find(m => m.user.toString() === user._id.toString());
    if (already) return res.status(409).json({ error: 'ALREADY_MEMBER' });

    org.members.push({ user: user._id, role });
    await org.save();

    user.orgs.addToSet(org._id);
    await user.save();

    res.status(201).json({ message: `${user.name} added as ${role}`, member: { user: { _id: user._id, name: user.name, email: user.email }, role } });
  } catch (err) { next(err); }
});

// PATCH /api/team/:userId/role
router.patch('/:userId/role', requireRole('owner', 'admin'), [
  body('role').isIn(['admin', 'accountant', 'viewer']),
], async (req, res, next) => {
  try {
    const org = await Organization.findById(req.org._id);
    const member = org.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ error: 'NOT_MEMBER' });
    if (member.role === 'owner') return res.status(403).json({ error: 'CANNOT_CHANGE_OWNER' });
    member.role = req.body.role;
    await org.save();
    res.json({ message: 'Role updated' });
  } catch (err) { next(err); }
});

// DELETE /api/team/:userId — remove member
router.delete('/:userId', requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const org = await Organization.findById(req.org._id);
    const member = org.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ error: 'NOT_MEMBER' });
    if (member.role === 'owner') return res.status(403).json({ error: 'CANNOT_REMOVE_OWNER' });
    org.members = org.members.filter(m => m.user.toString() !== req.params.userId);
    await org.save();
    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
});

// PATCH /api/team/org — update org settings
router.patch('/org/settings', requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const allowed = ['name', 'currency', 'fiscalYearStart', 'runwayAlertDays', 'lowBalanceThreshold', 'industry'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const org = await Organization.findByIdAndUpdate(req.org._id, updates, { new: true });
    res.json(org);
  } catch (err) { next(err); }
});

export default router;
