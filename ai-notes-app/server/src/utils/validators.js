import { HttpError } from './httpError.js';

export const CATEGORIES = ['Personal', 'Work', 'Meeting', 'Study', 'Ideas', 'Other'];
export const MAX_CONTENT = 20000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const bad = (message) => new HttpError(400, message, 'VALIDATION_ERROR');
const clean = (v) => (typeof v === 'string' ? v.trim() : '');

export const isUuid = (v) => typeof v === 'string' && UUID.test(v);

export function parseRegister(body = {}) {
  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const { password, confirmPassword } = body;
  if (name.length < 1 || name.length > 100) throw bad('Full name is required (max 100 characters).');
  if (!EMAIL.test(email) || email.length > 254) throw bad('Enter a valid email address.');
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    throw bad('Password must be 8-72 characters.');
  }
  if (password !== confirmPassword) throw bad('Passwords do not match.');
  return { name, email, password };
}

export function parseLogin(body = {}) {
  const email = clean(body.email).toLowerCase();
  if (!email || typeof body.password !== 'string' || !body.password) throw bad('Email and password are required.');
  return { email, password: body.password };
}

// Whitelist: only these fields can ever reach the database (prevents mass assignment).
// user_id is deliberately absent; ownership always comes from the session.
export function parseNote(body = {}) {
  const title = clean(body.title);
  const content = body.content ?? '';
  const category = body.category ?? 'Other';
  if (!title || title.length > 200) throw bad('Title is required (max 200 characters).');
  if (typeof content !== 'string' || content.length > MAX_CONTENT) throw bad(`Content must be text up to ${MAX_CONTENT} characters.`);
  if (!CATEGORIES.includes(category)) throw bad('Invalid category.');
  return { title, content, category };
}

export const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);
