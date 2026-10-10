import { getDb } from '../data/database';

export interface GlobalStreak {
  currentStreak: number;
  bestStreak: number;
}

/** Lectura de STREAK_CACHE (recalculada en toggleLog, ADR-006 — no fuente de verdad). */
export const streakCacheRepository = {
  async getGlobal(): Promise<GlobalStreak> {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      global_current_streak: number;
      global_best_streak: number;
    }>('SELECT global_current_streak, global_best_streak FROM streak_cache LIMIT 1');
    return {
      currentStreak: row?.global_current_streak ?? 0,
      bestStreak: row?.global_best_streak ?? 0,
    };
  },
};
