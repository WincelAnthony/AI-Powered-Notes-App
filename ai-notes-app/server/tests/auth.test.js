import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app, pool, resetDb, closeDb, signup } from './helpers.js';

before(resetDb);
after(closeDb);

test('register creates a user and sets an httpOnly cookie', async () => {
  const { res } = await signup();
  assert.equal(res.status, 201);
  assert.match(res.headers['set-cookie'][0], /HttpOnly/i);
  assert.equal(res.body.user.password_hash, undefined);
});

test('passwords are stored as bcrypt hashes, not plaintext', async () => {
  const { email, password } = await signup();
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', [email]);
  assert.notEqual(rows[0].password_hash, password);
  assert.match(rows[0].password_hash, /^\$2[aby]\$/);
});

test('login works with correct credentials', async () => {
  const { email, password } = await signup();
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, email);
});

test('invalid login returns 401 with a generic message', async () => {
  const { email } = await signup();
  const wrongPassword = await request(app).post('/api/auth/login').send({ email, password: 'nope-nope' });
  const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'x@example.com', password: 'nope-nope' });
  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.status, 401);
  assert.equal(wrongPassword.body.error.message, unknownEmail.body.error.message);
});

test('duplicate email and mismatched passwords are rejected', async () => {
  const { email } = await signup();
  const dup = await request(app).post('/api/auth/register')
    .send({ name: 'A', email, password: 'password123', confirmPassword: 'password123' });
  assert.equal(dup.status, 409);
  const mismatch = await request(app).post('/api/auth/register')
    .send({ name: 'A', email: 'new@example.com', password: 'password123', confirmPassword: 'different1' });
  assert.equal(mismatch.status, 400);
});

test('/me requires login; logout clears the session cookie', async () => {
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  const { agent } = await signup();
  assert.equal((await agent.get('/api/auth/me')).status, 200);
  const out = await agent.post('/api/auth/logout');
  assert.match(out.headers['set-cookie'][0], /token=;/);
});
