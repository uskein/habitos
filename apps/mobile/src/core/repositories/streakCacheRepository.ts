import { AppError, ERROR_CODES, LIMITS } from '@habitos/shared';
import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../data/database';
import type { StreakRepository } from '../domain/repositoryInterfaces';

export interface GlobalStreak {
  currentStreak: number;
  bestStreak: number;
}

async function profileId(db: SQLiteDatabase): Promise<string> {
  const p = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_profile LIMIT 1');
  if (!p) throw new AppError(ERROR_CODES.NOT_FOUND, 'Perfil no encontrado');
  return p.id;
}

/** Lectura de STREAK_CACHE (recalculada en toggleLog, ADR-006 — no fuente de verdad). */
export const streakCacheRepository: StreakRepository & {
  getGlobal(): Promise<GlobalStreak>;
} = {
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

  /** HU-27 — freezes restantes del mes (cuota 2/mes). */
  async availableFreezes(month: string): Promise<number> {
    const db = await getDb();
    const userId = await profileId(db);
    const row = await db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) AS n FROM streak_freeze WHERE user_id = ? AND substr(used_date, 1, 7) = ?`,
      userId,
      month,
    );
    return Math.max(0, LIMITS.FREEZE_MONTHLY_QUOTA - (row?.n ?? 0));
  },

  /** HU-27 — consume 1 freeze; cuota agotada → FREEZE_QUOTA_EXCEEDED. */
  async consumeFreeze(date: string): Promise<boolean> {
    const db = await getDb();
    const userId = await profileId(db);
    const month = date.slice(0, 7);

    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM streak_freeze WHERE user_id = ? AND used_date = ?',
      userId,
      date,
    );
    if (existing) return false; // ya protegido — idempotente

    const used = await db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) AS n FROM streak_freeze WHERE user_id = ? AND substr(used_date, 1, 7) = ?`,
      userId,
      month,
    );
    if ((used?.n ?? 0) >= LIMITS.FREEZE_MONTHLY_QUOTA) {
      throw new AppError(
        ERROR_CODES.FREEZE_QUOTA_EXCEEDED,
        `Cuota de ${LIMITS.FREEZE_MONTHLY_QUOTA} freezes agotada este mes`,
      );
    }

    await db.runAsync(
      'INSERT INTO streak_freeze (id, user_id, used_date) VALUES (?, ?, ?) ON CONFLICT DO NOTHING',
      randomUUID(),
      userId,
      date,
    );
    return true;
  },

  /** HU-27 — desactivar el freeze manual de `date`. */
  async releaseFreeze(date: string): Promise<void> {
    const db = await getDb();
    const userId = await profileId(db);
    await db.runAsync(
      'DELETE FROM streak_freeze WHERE user_id = ? AND used_date = ?',
      userId,
      date,
    );
  },

  async hasFreeze(date: string): Promise<boolean> {
    const db = await getDb();
    const userId = await profileId(db);
    const row = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM streak_freeze WHERE user_id = ? AND used_date = ?',
      userId,
      date,
    );
    return row !== null;
  },
};

/** Helper para el auto-consume en recompute (falla silenciosa ante cuota). */
export async function tryConsumeFreeze(date: string): Promise<boolean> {
  try {
    return await streakCacheRepository.consumeFreeze(date);
  } catch {
    return false;
  }
}