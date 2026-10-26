import type { SQLiteDatabase } from 'expo-sqlite';

export const version = 4;
export const name = '004_habit_weekly_target';

/** V5 · M42 — meta semanal por hábito (días/semana 1–7, NULL = sin meta). */
export const sql = `
ALTER TABLE habit ADD COLUMN weekly_target INTEGER
  CHECK (weekly_target IS NULL OR (weekly_target BETWEEN 1 AND 7));
`;
