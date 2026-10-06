import { HttpError } from '../../utils/httpError.js';
import { buildPrompt } from './prompts.js';
import { complete } from './providers.js';
import { validateAiOutput } from './validate.js';

const UNAVAILABLE = 'AI service is temporarily unavailable. Please try again.';

// note content + operation in, validated text out. Provider details never leave this file.
export async function runAiOperation(operation, noteContent, question) {
  const { system, user, maxTokens, instruction } = buildPrompt(operation, noteContent, question);

  let raw;
  try {
    raw = await complete({ operation, system, user, maxTokens });
  } catch (err) {
    console.error(`[ai] provider failure (${operation}):`, err.message); // server log only
    throw new HttpError(503, UNAVAILABLE, 'AI_UNAVAILABLE');
  }

  try {
    return { text: validateAiOutput(operation, raw), prompt: question ?? instruction };
  } catch (err) {
    console.error(`[ai] invalid response (${operation}):`, err.message);
    throw new HttpError(502, UNAVAILABLE, 'AI_INVALID_RESPONSE');
  }
}
