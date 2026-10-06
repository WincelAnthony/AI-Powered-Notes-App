import { HttpError } from '../utils/httpError.js';
import { getOwnedNote } from '../services/notes.service.js';
import { runAiOperation } from '../services/ai/ai.service.js';
import { getUsage, saveGeneration } from '../services/ai/usage.service.js';

// Builds a handler for one operation: validate -> ownership -> usage limit -> AI -> store -> respond.
export const generate = (operation) => async (req, res) => {
  const { noteId, question } = req.body ?? {};
  if (typeof noteId !== 'string') throw new HttpError(400, 'noteId is required.', 'VALIDATION_ERROR');

  let cleanQuestion;
  if (operation === 'question') {
    cleanQuestion = typeof question === 'string' ? question.trim() : '';
    if (!cleanQuestion || cleanQuestion.length > 500) {
      throw new HttpError(400, 'Enter a question (max 500 characters).', 'VALIDATION_ERROR');
    }
  }

  const note = await getOwnedNote(noteId, req.user.id); // 403 if it's someone else's note
  if (!note.content.trim()) throw new HttpError(400, 'Add some content to this note first.', 'VALIDATION_ERROR');

  const usage = await getUsage(req.user.id);
  if (usage.used >= usage.limit) throw new HttpError(429, "You've reached today's AI usage limit.", 'AI_LIMIT_REACHED');

  const { text, prompt } = await runAiOperation(operation, note.content, cleanQuestion);
  const generation = await saveGeneration({
    userId: req.user.id, noteId: note.id, operation, prompt, response: text,
  });
  res.status(201).json({ generation, usage: { used: usage.used + 1, limit: usage.limit } });
};

export async function usage(req, res) {
  res.json({ usage: await getUsage(req.user.id) });
}
