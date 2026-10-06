import bcrypt from 'bcrypt';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { HttpError } from '../utils/httpError.js';
import { parseRegister, parseLogin } from '../utils/validators.js';
import { COOKIE, signToken, cookieOptions } from '../middleware/auth.js';

// Compared against when the email is unknown so login timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', config.bcryptRounds);

export async function register(req, res) {
  const { name, email, password } = parseRegister(req.body);
  const hash = await bcrypt.hash(password, config.bcryptRounds);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING RETURNING id, name, email`,
    [name, email, hash],
  );
  if (!rows[0]) throw new HttpError(409, 'An account with this email already exists.', 'EMAIL_TAKEN');
  res.cookie(COOKIE, signToken(rows[0].id), cookieOptions());
  res.status(201).json({ user: rows[0] });
}

export async function login(req, res) {
  const { email, password } = parseLogin(req.body);
  const { rows } = await query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
  const ok = await bcrypt.compare(password, rows[0]?.password_hash ?? DUMMY_HASH);
  if (!rows[0] || !ok) throw new HttpError(401, 'Invalid email or password.', 'INVALID_LOGIN');
  const { password_hash, ...user } = rows[0];
  res.cookie(COOKIE, signToken(user.id), cookieOptions());
  res.json({ user });
}

export function logout(req, res) {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ message: 'Logged out.' });
}

export const me = (req, res) => res.json({ user: req.user });
