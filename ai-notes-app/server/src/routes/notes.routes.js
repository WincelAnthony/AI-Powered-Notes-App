import { Router } from 'express';
import { asyncHandler as h } from '../utils/httpError.js';
import { requireAuth } from '../middleware/auth.js';
import * as notes from '../controllers/notes.controller.js';

const router = Router();
router.use(requireAuth); // every notes route requires a logged-in user

router.get('/', h(notes.list));
router.post('/', h(notes.create));
router.get('/stats', h(notes.stats)); // must come before '/:id'
router.get('/:id', h(notes.get));
router.put('/:id', h(notes.update));
router.delete('/:id', h(notes.remove));
router.patch('/:id/archive', h(notes.archive));
router.get('/:id/ai-history', h(notes.aiHistory));
export default router;
