CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'Other'
              CHECK (category IN ('Personal','Work','Meeting','Study','Ideas','Other')),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes (user_id, is_archived, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_generations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_id    UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  operation  TEXT NOT NULL CHECK (operation IN ('summary','key_points','action_items','title','question')),
  prompt     TEXT NOT NULL,
  response   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_note ON ai_generations (note_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_user_day ON ai_generations (user_id, created_at);
