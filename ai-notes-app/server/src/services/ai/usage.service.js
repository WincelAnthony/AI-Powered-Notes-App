import { query } from '../../db/pool.js';
import { config } from '../../config.js';

// "Today" = current UTC day. Usage is simply a COUNT over the ai_generations table.
export async function getUsage(userId) {
  const { rows } = await query(
    `SELECT count(*)::int AS used FROM ai_generations
     WHERE user_id = $1 AND created_at >= (date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')`,
    [userId],
  );
  return { used: rows[0].used, limit: config.ai.dailyLimit };
}

export async function saveGeneration({ userId, noteId, operation, prompt, response }) {
  const { rows } = await query(
    `INSERT INTO ai_generations (user_id, note_id, operation, prompt, response)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, operation, prompt, response, created_at`,
    [userId, noteId, operation, prompt, response],
  );
  return rows[0];
}
