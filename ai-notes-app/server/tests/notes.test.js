import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { resetDb, closeDb, signup, makeNote } from './helpers.js';

before(resetDb);
after(closeDb);

test('create, read, update, archive, search and delete a note', async () => {
  const { agent } = await signup();
  const note = await makeNote(agent);
  assert.equal(note.category, 'Meeting');

  assert.equal((await agent.get(`/api/notes/${note.id}`)).body.note.title, 'Team Meeting');

  const updated = await agent.put(`/api/notes/${note.id}`).send({ title: 'Renamed', content: 'website launch', category: 'Work' });
  assert.equal(updated.body.note.title, 'Renamed');

  const found = await agent.get('/api/notes?q=WEBSITE&category=Work');
  assert.equal(found.body.notes.length, 1);
  assert.equal((await agent.get('/api/notes?q=nothing-matches')).body.notes.length, 0);

  const archived = await agent.patch(`/api/notes/${note.id}/archive`);
  assert.equal(archived.body.note.is_archived, true);
  assert.equal((await agent.get('/api/notes')).body.notes.length, 0); // hidden from active list
  assert.equal((await agent.get('/api/notes?archived=true')).body.notes.length, 1);

  assert.equal((await agent.delete(`/api/notes/${note.id}`)).status, 200);
  assert.equal((await agent.get(`/api/notes/${note.id}`)).status, 404);
});

test('invalid note data is rejected and clients cannot choose user_id', async () => {
  const { agent, user } = await signup();
  assert.equal((await agent.post('/api/notes').send({ title: '', content: 'x' })).status, 400);
  assert.equal((await agent.post('/api/notes').send({ title: 'x', category: 'Nope' })).status, 400);
  const other = await signup();
  const res = await agent.post('/api/notes').send({ title: 'Mine', content: 'x', user_id: other.user.id });
  assert.equal(res.body.note.user_id, user.id);
});

test('notes endpoints require authentication', async () => {
  const { agent: stranger } = { agent: (await import('supertest')).default((await import('./helpers.js')).app) };
  assert.equal((await stranger.get('/api/notes')).status, 401);
});

test('a user cannot read, edit, or delete another user\'s note', async () => {
  const owner = await signup('Owner');
  const intruder = await signup('Intruder');
  const note = await makeNote(owner.agent);

  assert.equal((await intruder.agent.get(`/api/notes/${note.id}`)).status, 403);
  assert.equal((await intruder.agent.put(`/api/notes/${note.id}`).send({ title: 'hacked', content: '' })).status, 403);
  assert.equal((await intruder.agent.delete(`/api/notes/${note.id}`)).status, 403);
  assert.equal((await intruder.agent.patch(`/api/notes/${note.id}/archive`)).status, 403);
  assert.equal((await intruder.agent.get(`/api/notes/${note.id}/ai-history`)).status, 403);
  assert.equal((await intruder.agent.get('/api/notes')).body.notes.length, 0);
  assert.equal((await owner.agent.get(`/api/notes/${note.id}`)).body.note.title, 'Team Meeting'); // untouched
});
