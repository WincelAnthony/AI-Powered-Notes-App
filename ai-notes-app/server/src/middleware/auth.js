import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';

export const COOKIE = 'token';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const signToken = (userId) => jwt.sign({ sub: userId }, config.authSecret, { algorithm: 'HS256', expiresIn: '7d' });

// httpOnly: JavaScript in the browser can't read the token (protects against XSS theft).
export const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.nodeEnv === 'production',
  maxAge: WEEK_MS,
  path: '/',
});

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE];
  if (!token) throw new HttpError(401, 'Authentication required.', 'UNAUTHENTICATED');
  let payload;
  try {
    payload = jwt.verify(token, config.authSecret, { algorithms: ['HS256'] });
  } catch {
    throw new HttpError(401, 'Session expired. Please log in again.', 'UNAUTHENTICATED');
  }
  const { rows } = await query('SELECT id, name, email FROM users WHERE id = $1', [payload.sub]);
  if (!rows[0]) throw new HttpError(401, 'Authentication required.', 'UNAUTHENTICATED');
  req.user = rows[0];
  next();
});
