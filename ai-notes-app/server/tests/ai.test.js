import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { app, resetDb, closeDb, signup, makeNote } from './helpers.js';
import { validateAiOutput } from '../src/services/ai/validate.js';

before(resetDb);
after(closeDb);

const OPS = [
  ['summarize', 'summary', {}],
  ['key-points', 'key_points', {}],
  ['action-items', 'action_items', {}],
  ['title', 'title', {}],
  ['question', 'question', { question: 'What is the deadline?' }],
];

test('all five AI operations return and store a result', async () => {
  const { agent } = await signup();
  const note = await makeNote(agent);
  for (const [route, operation, extra] of OPS) {
    const res = await agent.post(`/api/ai/${route}`).send({ noteId: note.id, ...extra });
    assert.equal(res.status, 201, route);
    assert.equal(res.body.generation.operation, operation);
    assert.ok(res.body.generation.response.length > 0);
  }
  const history = await agent.get(`/api/notes/${note.id}/ai-history`);
  assert.equal(history.body.history.length, 5);
});

test('AI endpoints require authentication', async () => {
  const res = await request(app).post('/api/ai/summarize').send({ noteId: 'x' });
  assert.equal(res.status, 401);
});

test('a user cannot send another user\'s note to the AI', async () => {
  const owner = await signup();
  const intruder = await signup();
  const note = await makeNote(owner.agent);
  const res = await intruder.agent.post('/api/ai/summarize').send({ noteId: note.id });
  assert.equal(res.status, 403);
  assert.equal((await intruder.agent.get('/api/ai/usage')).body.usage.used, 0); // nothing was consumed
});

test('the daily AI usage limit returns 429', async () => {
  const { agent } = await signup();
  const note = await makeNote(agent);
  for (let i = 0; i < 6; i++) assert.equal((await agent.post('/api/ai/summarize').send({ noteId: note.id })).status, 201);
  const blocked = await agent.post('/api/ai/summarize').send({ noteId: note.id });
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.error.message, /usage limit/);
});

test('provider failure gives a generic error and does not use up quota', async () => {
  const { agent } = await signup();
  const note = await makeNote(agent, { content: 'FORCE_AI_FAILURE please' });
  const res = await agent.post('/api/ai/summarize').send({ noteId: note.id });
  assert.equal(res.status, 503);
  assert.equal(res.body.error.message, 'AI service is temporarily unavailable. Please try again.');
  assert.equal((await agent.get('/api/ai/usage')).body.usage.used, 0);
});

test('question requires question text', async () => {
  const { agent } = await signup();
  const note = await makeNote(agent);
  assert.equal((await agent.post('/api/ai/question').send({ noteId: note.id })).status, 400);
});

test('AI output validation rejects bad responses', () => {
  assert.throws(() => validateAiOutput('summary', ''));
  assert.throws(() => validateAiOutput('summary', 'x'.repeat(5000)));
  assert.throws(() => validateAiOutput('key_points', 'just prose, not JSON'));
  assert.throws(() => validateAiOutput('action_items', '{"items":[{"owner":null}]}'));
  assert.equal(validateAiOutput('key_points', '```json\n{"items":["A"]}\n```'), '• A');
  assert.equal(validateAiOutput('action_items', '{"items":[{"owner":null,"task":"Ship"}]}'), '☐ Ship');
  assert.equal(validateAiOutput('title', '"Website Redesign Planning."'), 'Website Redesign Planning');
});

test('the AI API key is never exposed to the client', async () => {
  const secret = process.env.AI_API_KEY;
  const { agent, res } = await signup();
  const note = await makeNote(agent);
  const ai = await agent.post('/api/ai/summarize').send({ noteId: note.id });
  for (const r of [res, ai, await agent.get('/api/auth/me'), await agent.get(`/api/notes/${note.id}`)]) {
    assert.ok(!JSON.stringify(r.body).includes(secret) && !JSON.stringify(r.headers).includes(secret));
  }
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
  const clientDir = fileURLToPath(new URL('../../client/src', import.meta.url));
  for (const file of walk(clientDir)) {
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(!/AI_API_KEY|api\.anthropic\.com|api\.openai\.com/.test(text), `${file} references provider secrets`);
  }
});
