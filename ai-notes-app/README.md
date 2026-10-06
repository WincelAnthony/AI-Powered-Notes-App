# AI-Powered Notes App

## Overview
A full-stack notes app (React + Express + PostgreSQL) where logged-in users create, search and organize notes, then use AI to summarize them, extract key points and action items, generate titles, and ask questions about a note. Built as a learning project: the AI is called **only from the backend**, so the API key never reaches the browser.

## Features
Authentication (bcrypt + httpOnly JWT cookie) · Note CRUD · Search (title + content) · Categories, archive and date filters · AI summaries · Key points · Action items · AI titles · AI Q&A · AI history per note · Daily AI usage limit

## Architecture
```
React ──► Express REST API ──► PostgreSQL

React ──► Express ──► Auth middleware ──► Ownership check ──► AI controller
                                                               ──► AI service ──► AI provider
```
```
server/src
  routes/       URL -> controller wiring, per-route middleware
  controllers/  HTTP in/out: validate input, call services, shape the response
  services/     notes.service (ownership gate), ai/ (prompts, providers, validation, usage)
  middleware/   requireAuth, error handler
  db/           pool, schema.sql, migrate.js
client/src      pages/, components/, hooks/, services/api.js (the only place fetch is used)
```

## Database Schema
- **users**: id, name, email (unique), password_hash, created_at, updated_at
- **notes**: id, user_id → users, title, content, category (CHECK in 6 values), is_archived, created_at, updated_at
- **ai_generations**: id, user_id → users, note_id → notes, operation (summary | key_points | action_items | title | question), prompt, response, created_at

Deleting a user deletes their notes; deleting a note deletes its AI history (`ON DELETE CASCADE`).

## API Documentation
All routes except register/login/logout require the session cookie. Errors look like `{ "error": { "message", "code" } }`.

| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/register | `{name, email, password, confirmPassword}` → 201 |
| POST | /api/auth/login | `{email, password}` → 200, sets cookie |
| POST | /api/auth/logout | clears cookie |
| GET | /api/auth/me | current user |
| GET | /api/notes | query: `q, category, archived=false|true|all, from, to, limit, offset` |
| GET | /api/notes/stats | counts, categories, 5 recent |
| POST | /api/notes | `{title, content, category}` |
| GET / PUT / DELETE | /api/notes/:id | owner only (403 otherwise) |
| PATCH | /api/notes/:id/archive | toggles archive |
| GET | /api/notes/:id/ai-history | last 20 generations |
| POST | /api/ai/summarize, key-points, action-items, title | `{noteId}` → 201 `{generation, usage}` |
| POST | /api/ai/question | `{noteId, question}` |
| GET | /api/ai/usage | `{used, limit}` |

Status codes: 400 validation · 401 not logged in · 403 not your note · 404 missing · 429 rate/usage limit · 502/503 AI failure · 500 unexpected.

## Environment Variables
Copy `.env.example` to `.env` in the project root (never commit it).
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: 32+ random characters used to sign login tokens
- `AI_PROVIDER`: `mock` (no key needed), `anthropic`, or `openai` (any OpenAI-compatible API)
- `AI_API_KEY`, `AI_MODEL`: required for real providers. Example Anthropic model: `claude-haiku-4-5-20251001`
- `AI_DAILY_LIMIT`, `AI_PER_MINUTE_LIMIT`, `AI_TIMEOUT_MS`, `CLIENT_ORIGIN`, `PORT`, `TEST_DATABASE_URL`

## Installation
Requires Node 20+ and PostgreSQL 13+.
```bash
createdb ai_notes && createdb ai_notes_test
cp .env.example .env            # then fill in DATABASE_URL and AUTH_SECRET

cd server && npm install && npm run db:migrate && npm run dev     # API on :4000
cd client && npm install && npm run dev                           # app on :5173
```
Start with `AI_PROVIDER=mock` to try the full flow offline, then switch to a real provider.

## Testing
```bash
cd server && npm test
```
Uses `TEST_DATABASE_URL` (the tests wipe it) and the mock AI provider. Covers auth, CRUD, ownership/authorization for notes and AI, AI operations and validation, the usage limit, password hashing, and "API key never leaks".

## What I Learned
- **AI API integration**: calling a provider server-side behind a small adapter, so providers are swappable.
- **Prompt engineering**: separating system rules from untrusted note text, constraining output format.
- **REST APIs**: resources, verbs, status codes, consistent error shape.
- **Authentication**: hashing, httpOnly cookies, middleware.
- **CRUD & PostgreSQL**: schema design, constraints, indexes, parameterized queries.
- **API security**: ownership checks, input whitelisting, request size limits, CORS, helmet.
- **Rate limiting**: a per-minute burst limiter and a database-backed daily quota.
- **Error handling**: one error middleware, no leaked internals, friendly AI failures.

See `docs/LEARNING.md` for the guided walkthrough, prompt exercise and improvement ideas.
