import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { asyncHandler, HttpError } from '../utils/httpError.js';
import { requireAuth } from '../middleware/auth.js';
import * as auth from '../controllers/auth.controller.js';

const router = Router();
// Slows down password guessing.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skip: () => config.nodeEnv === 'test',
  handler: (req, res, next) => next(new HttpError(429, 'Too many attempts. Try again later.', 'RATE_LIMITED')),
});

router.post('/register', limiter, asyncHandler(auth.register));
router.post('/login', limiter, asyncHandler(auth.login));
router.post('/logout', auth.logout);
router.get('/me', requireAuth, auth.me);
export default router;
