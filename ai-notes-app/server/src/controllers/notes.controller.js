import { query } from '../db/pool.js';
import { getOwnedNote } from '../services/notes.service.js';
import { CATEGORIES, parseNote, escapeLike } from '../utils/validators.js';

const LIST_COLUMNS = 'id, title, category, is_archived, created_at, updated_at, left(content, 200) AS excerpt';
const isDate = (s) => typeof s === 'string' && !Number.isNaN(Date.parse(s));

export async function list(req, res) {
  const { q, category, archived = 'false', from, to } = req.query;
  const params = [req.user.id];
  const where = ['user_id = $1'];
  const add = (sql, value) => { params.push(value); where.push(sql.replaceAll('?', `$${params.length}`)); };

  if (archived === 'true') where.push('is_archived = true');
  else if (archived !== 'all') where.push('is_archived = false');
  if (CATEGORIES.includes(category)) add('category = ?', category);
  if (typeof q === 'string' && q.trim()) add('(title ILIKE ? OR content ILIKE ?)', `%${escapeLike(q.trim().slice(0, 100))}%`);
  if (isDate(from)) add('created_at >= ?::date', from);
  if (isDate(to)) add('created_at < (?::date + 1)', to);

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const { rows } = await query(
    `SELECT ${LIST_COLUMNS} FROM notes WHERE ${where.join(' AND ')} ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}`,
    params,
  );
  res.json({ notes: rows });
}

export async function stats(req, res) {
  const id = req.user.id;
  const [counts, categories, recent] = await Promise.all([
    query(`SELECT count(*) FILTER (WHERE NOT is_archived)::int AS active,
                  count(*) FILTER (WHERE is_archived)::int AS archived FROM notes WHERE user_id = $1`, [id]),
    query(`SELECT category, count(*)::int AS count FROM notes WHERE user_id = $1 AND NOT is_archived
           GROUP BY category ORDER BY category`, [id]),
    query(`SELECT ${LIST_COLUMNS} FROM notes WHERE user_id = $1 AND NOT is_archived ORDER BY updated_at DESC LIMIT 5`, [id]),
  ]);
  res.json({ ...counts.rows[0], categories: categories.rows, recent: recent.rows });
}

export async function get(req, res) {
  res.json({ note: await getOwnedNote(req.params.id, req.user.id) });
}

export async function create(req, res) {
  const { title, content, category } = parseNote(req.body);
  const { rows } = await query(
    'INSERT INTO notes (user_id, title, content, category) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.user.id, title, content, category], // user_id comes from the session, never the request body
  );
  res.status(201).json({ note: rows[0] });
}

export async function update(req, res) {
  await getOwnedNote(req.params.id, req.user.id);
  const { title, content, category } = parseNote(req.body);
  const { rows } = await query(
    'UPDATE notes SET title = $1, content = $2, category = $3, updated_at = now() WHERE id = $4 AND user_id = $5 RETURNING *',
    [title, content, category, req.params.id, req.user.id],
  );
  res.json({ note: rows[0] });
}

export async function remove(req, res) {
  await getOwnedNote(req.params.id, req.user.id);
  await query('DELETE FROM notes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ message: 'Note deleted.' });
}

export async function archive(req, res) {
  await getOwnedNote(req.params.id, req.user.id);
  const { rows } = await query(
    'UPDATE notes SET is_archived = NOT is_archived, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING *',
    [req.params.id, req.user.id],
  );
  res.json({ note: rows[0] });
}

export async function aiHistory(req, res) {
  await getOwnedNote(req.params.id, req.user.id);
  const { rows } = await query(
    `SELECT id, operation, prompt, response, created_at FROM ai_generations
     WHERE note_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 20`,
    [req.params.id, req.user.id],
  );
  res.json({ history: rows });
}
