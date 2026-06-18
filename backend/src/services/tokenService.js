import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

export function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}
