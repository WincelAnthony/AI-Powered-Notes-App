import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { asyncHandler as h, HttpError } from '../utils/httpError.js';
import { requireAuth } from '../middleware/auth.js';
import { generate, usage } from '../controllers/ai.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/usage', h(usage));

// Short-window burst limit per user (separate from the daily quota stored in the database).
router.use(rateLimit({
  windowMs: 60 * 1000,
  limit: config.ai.perMinuteLimit,
  keyGenerator: (req) => req.user.id,
  handler: (req, res, next) => next(new HttpError(429, 'Too many AI requests. Please wait a minute.', 'RATE_LIMITED')),
}));

const OPERATION_BY_PATH = {
  summarize: 'summary',
  'key-points': 'key_points',
  'action-items': 'action_items',
  title: 'title',
  question: 'question',
};
for (const [path, operation] of Object.entries(OPERATION_BY_PATH)) {
  router.post(`/${path}`, h(generate(operation)));
}
export default router;
