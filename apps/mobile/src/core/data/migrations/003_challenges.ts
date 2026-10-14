export const version = 3;
export const name = '003_challenges';

/** M36 — retos locales: reto de N días sobre un hábito con progreso por check-ins. */
export const sql = `
CREATE TABLE challenge (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  habit_id TEXT NOT NULL REFERENCES habit(id) ON DELETE CASCADE,
  days INTEGER NOT NULL CHECK (days IN (7, 14, 30, 60, 90)),
  start_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_challenge_user_status ON challenge (user_id, status);
CREATE INDEX idx_challenge_habit ON challenge (habit_id);
`;
