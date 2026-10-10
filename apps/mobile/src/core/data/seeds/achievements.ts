import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import catalog from './achievements.json';
import type { Achievement } from '../../domain/entities/achievement';

/** Seed idempotente — INSERT OR IGNORE por key (MODELO_DE_DATOS §5). */
export async function seedAchievements(db: SQLiteDatabase): Promise<void> {
  for (const a of catalog) {
    await db.runAsync(
      `INSERT INTO achievement (id, key, title, description, icon, criteria)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(key) DO NOTHING`,
      randomUUID(),
      a.key,
      a.title,
      a.description,
      a.icon,
      JSON.stringify(a.criteria),
    );
  }
}

export function rowToAchievement(r: {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  criteria: string;
}): Achievement {
  return {
    id: r.id,
    key: r.key,
    title: r.title,
    description: r.description,
    icon: r.icon,
    criteria: JSON.parse(r.criteria),
  };
}
