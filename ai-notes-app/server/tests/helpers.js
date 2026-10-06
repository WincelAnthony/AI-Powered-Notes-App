import './setup.js';
import fs from 'node:fs';
import request from 'supertest';

export const { default: app } = await import('../src/app.js');
export const { pool } = await import('../src/db/pool.js');

export async function resetDb() {
  await pool.query(fs.readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf8'));
  await pool.query('TRUNCATE users CASCADE');
}
export const closeDb = () => pool.end();

export async function signup(name = 'Test User') {
  const agent = request.agent(app); // keeps the auth cookie between calls, like a browser
  const email = `u${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'password123';
  const res = await agent.post('/api/auth/register').send({ name, email, password, confirmPassword: password });
  return { agent, user: res.body.user, email, password, res };
}

export async function makeNote(agent, overrides = {}) {
  const res = await agent.post('/api/notes').send({
    title: 'Team Meeting', category: 'Meeting', content: 'John handles frontend. Launch is October 20.', ...overrides,
  });
  return res.body.note;
}
