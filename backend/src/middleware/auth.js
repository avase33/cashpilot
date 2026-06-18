import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No token provided' });
    }
    const token = header.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Access token expired' });
      }
      return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Invalid token' });
    }
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireOrgAccess(req, res, next) {
  try {
    const orgId = req.headers['x-org-id'] || req.user?.activeOrg?.toString();
    if (!orgId) return res.status(400).json({ error: 'NO_ORG', message: 'Organization not specified' });
    const { default: Organization } = await import('../models/Organization.js');
    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ error: 'ORG_NOT_FOUND', message: 'Organization not found' });
    const member = org.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) return res.status(403).json({ error: 'NOT_MEMBER', message: 'Not a member of this organization' });
    req.org = org;
    req.orgRole = member.role;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.orgRole)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    next();
  };
}
