import type { SQLiteDatabase } from 'expo-sqlite';

export const version = 2;
export const name = '002_v2';

/** MODELO_DE_DATOS.md §2.8–§2.13 — tablas V2 + extensiones + mejoras V2.1. */
export const sql = `
ALTER TABLE user_profile ADD COLUMN photo_uri TEXT;

ALTER TABLE achievement ADD COLUMN is_custom INTEGER NOT NULL DEFAULT 0;
ALTER TABLE achievement ADD COLUMN progress_style TEXT NOT NULL DEFAULT 'hidden';
ALTER TABLE achievement ADD COLUMN unlock_mode TEXT NOT NULL DEFAULT 'auto';

ALTER TABLE habit ADD COLUMN time_slot TEXT
  CHECK (time_slot IS NULL OR time_slot IN ('morning','afternoon','evening'));

CREATE TABLE milestone (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 80),
  note TEXT CHECK (note IS NULL OR length(note) <= 500),
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_state TEXT NOT NULL DEFAULT 'pending' CHECK (sync_state IN ('pending','synced'))
);

CREATE TABLE milestone_image (
  id TEXT PRIMARY KEY,
  milestone_id TEXT NOT NULL REFERENCES milestone(id) ON DELETE CASCADE,
  uri TEXT NOT NULL,
  position INTEGER NOT NULL,
  UNIQUE (milestone_id, position)
);

CREATE TABLE milestone_link (
  milestone_id TEXT NOT NULL REFERENCES milestone(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('habit','goal')),
  entity_id TEXT NOT NULL,
  PRIMARY KEY (milestone_id, entity_type, entity_id)
);

CREATE TABLE motivation (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (length(text) <= 140),
  emoji TEXT NOT NULL DEFAULT '🔥',
  goal_id TEXT REFERENCES goal(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL DEFAULT 'no_streak'
    CHECK (trigger_type IN ('no_streak','morning','missed_day')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE motivation_show (
  motivation_id TEXT NOT NULL REFERENCES motivation(id) ON DELETE CASCADE,
  shown_on TEXT NOT NULL,
  PRIMARY KEY (motivation_id, shown_on)
);

CREATE TABLE stats_cache (
  key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  computed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE streak_freeze (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
  used_date TEXT NOT NULL,
  UNIQUE (user_id, used_date)
);

CREATE INDEX idx_milestone_user_date ON milestone (user_id, occurred_at DESC);
CREATE INDEX idx_milestone_image_pos ON milestone_image (milestone_id, position);
CREATE INDEX idx_motivation_goal ON motivation (goal_id, active);
CREATE INDEX idx_habit_log_created ON habit_log (habit_id, created_at);
CREATE INDEX idx_goal_update_created ON goal_update (goal_id, created_at);
CREATE INDEX idx_stats_cache_computed ON stats_cache (computed_at);
`;
