import { randomUUID } from 'expo-crypto';
import type { AchievementEvent } from '@habitos/shared';
import type { SQLiteDatabase } from 'expo-sqlite';
import { rowToAchievement, seedAchievements } from '../data/seeds/achievements';
import { computeGlobalStreak } from '../domain/services/streakCalculator';
import { evaluateEvent, type EvaluationStats } from '../domain/services/levelService';

async function loadStats(db: SQLiteDatabase): Promise<EvaluationStats> {
  const habitCount = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM habit WHERE is_archived = 0',
  );
  const dates = await db.getAllAsync<{ log_date: string }>(
    'SELECT DISTINCT log_date FROM habit_log WHERE completed = 1 ORDER BY log_date',
  );
  const checkins = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM well_entry',
  );
  const goalsCompleted = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM goal WHERE status = 'completed'",
  );

  const global = computeGlobalStreak(
    dates.map((d) => d.log_date),
    new Date().toISOString().slice(0, 10),
  );

  return {
    habitCount: habitCount?.n ?? 0,
    globalCompletedDates: dates.map((d) => d.log_date),
    bestGlobalStreak: global.bestStreak,
    checkinCount: checkins?.n ?? 0,
    goalsCompleted: goalsCompleted?.n ?? 0,
  };
}

/**
 * Evalúa y desbloquea logros DENTRO de la transacción llamante (§4).
 * UNIQUE(user_id, achievement_id) + INSERT ... DO NOTHING → idempotente.
 */
export async function evaluateAchievementEvent(
  db: SQLiteDatabase,
  event: AchievementEvent,
): Promise<void> {
  const profile = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_profile LIMIT 1');
  if (!profile) return;

  await seedAchievements(db);

  const catalogRows = await db.getAllAsync<{
    id: string;
    key: string;
    title: string;
    description: string;
    icon: string;
    criteria: string;
  }>('SELECT id, key, title, description, icon, criteria FROM achievement');
  const catalog = catalogRows.map(rowToAchievement);

  const unlockRows = await db.getAllAsync<{ id: string; achievement_id: string }>(
    'SELECT id, achievement_id FROM achievement_unlock WHERE user_id = ?',
    profile.id,
  );
  const unlocks = unlockRows.map((r) => ({
    id: r.id,
    userId: profile.id,
    achievementId: r.achievement_id,
    unlockedAt: '',
  }));

  const stats = await loadStats(db);
  const keys = evaluateEvent(catalog, unlocks, event, stats, new Date().toISOString().slice(0, 10));

  for (const key of keys) {
    const ach = catalog.find((a) => a.key === key);
    if (!ach) continue;
    await db.runAsync(
      `INSERT INTO achievement_unlock (id, user_id, achievement_id) VALUES (?, ?, ?)
       ON CONFLICT (user_id, achievement_id) DO NOTHING`,
      randomUUID(),
      profile.id,
      ach.id,
    );
  }
}
