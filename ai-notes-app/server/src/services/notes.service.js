import { query } from '../db/pool.js';
import { HttpError } from '../utils/httpError.js';
import { isUuid } from '../utils/validators.js';

// THE ownership gate. Every note read/update/delete/AI call goes through here.
export async function getOwnedNote(noteId, userId) {
  if (!isUuid(noteId)) throw new HttpError(404, 'Note not found.', 'NOT_FOUND');
  const { rows } = await query('SELECT * FROM notes WHERE id = $1', [noteId]);
  const note = rows[0];
  if (!note) throw new HttpError(404, 'Note not found.', 'NOT_FOUND');
  if (note.user_id !== userId) throw new HttpError(403, 'You do not have access to this note.', 'FORBIDDEN');
  return note;
}
