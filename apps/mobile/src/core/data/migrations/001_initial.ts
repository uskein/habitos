import type { SQLiteDatabase } from 'expo-sqlite';

export const version = 1;
export const name = '001_initial';

/** MODELO_DE_DATOS.md §1–3 — 12 tablas + índices. */
export const sql = `
CREATE TABLE user_profile (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (length(display_name) <= 40),
  avatar_seed INTEGER NOT NULL,
  locale TEXT NOT NULL DEFAULT 'es',
  theme_mode TEXT NOT NULL DEFAULT 'system' CHECK (theme_mode IN ('light','dark','system')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE habit (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bienestar','meta','habito')),
  color_token TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','custom')),
  custom_days TEXT,
  target_value INTEGER CHECK (target_value IS NULL OR target_value >= 1),
  unit TEXT,
  reminder_time TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','deleted'))
);

CREATE TABLE habit_schedule (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES habit(id) ON DELETE CASCADE,
  scheduled_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (habit_id, scheduled_date)
);

CREATE TABLE habit_log (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES habit(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  completed INTEGER NOT NULL,
  value REAL,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','deleted')),
  UNIQUE (habit_id, log_date)
);

CREATE TABLE habit_streak_cache (
  habit_id TEXT PRIMARY KEY REFERENCES habit(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date TEXT,
  recomputed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE goal (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) <= 80),
  description TEXT,
  category TEXT,
  target_value REAL NOT NULL CHECK (target_value > 0),
  current_value REAL NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  unit TEXT,
  deadline TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','deleted'))
);

CREATE TABLE goal_update (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goal(id) ON DELETE CASCADE,
  delta REAL NOT NULL CHECK (delta <> 0),
  note TEXT,
  entry_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE well_entry (
  id TEXT PRIMARY KEY,
  entry_date TEXT NOT NULL UNIQUE,
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  energy INTEGER NOT NULL CHECK (energy BETWEEN 1 AND 5),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','deleted'))
);

CREATE TABLE achievement (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria TEXT NOT NULL
);

CREATE TABLE achievement_unlock (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievement(id) ON DELETE CASCADE,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, achievement_id)
);

CREATE TABLE streak_cache (
  user_id TEXT PRIMARY KEY REFERENCES user_profile(id) ON DELETE CASCADE,
  global_current_streak INTEGER NOT NULL DEFAULT 0,
  global_best_streak INTEGER NOT NULL DEFAULT 0,
  recomputed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE outbox (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  op TEXT NOT NULL CHECK (op IN ('create','update','delete')),
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed'))
);

CREATE INDEX idx_habit_log_date ON habit_log (log_date);
CREATE INDEX idx_habit_feed ON habit (is_archived, sort_order);
CREATE INDEX idx_habit_log_history ON habit_log (habit_id, log_date DESC);
CREATE INDEX idx_well_entry_date ON well_entry (entry_date);
CREATE INDEX idx_goal_status ON goal (status);
CREATE INDEX idx_outbox_status ON outbox (status);
`;
