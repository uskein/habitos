import {
  AppError,
  ERROR_CODES,
  type AchievementEvent,
  type CreateCustomAchievementInputType,
} from '@habitos/shared';
import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../data/database';
import { rowToAchievement, seedAchievements } from '../data/seeds/achievements';
import type { Achievement, AchievementUnlock } from '../domain/entities/achievement';
import type { AchievementRepository } from '../domain/repositoryInterfaces';
import { evaluateAchievementEvent } from './achievementEvaluation';

const ACH_COLS = 'id, key, title, description, icon, criteria, is_custom, progress_style, unlock_mode';

async function assertCustom(db: SQLiteDatabase, achievementId: string): Promise<void> {
  const row = await db.getFirstAsync<{ is_custom: number }>(
    'SELECT is_custom FROM achievement WHERE id = ?',
    achievementId,
  );
  if (!row) throw new AppError(ERROR_CODES.NOT_FOUND, 'Medalla no encontrada');
  if (row.is_custom !== 1) {
    throw new AppError(ERROR_CODES.ACHIEVEMENT_SEED_IMMUTABLE, 'Las medallas semilla no se editan');
  }
}

export const achievementRepository: AchievementRepository = {
  async listCatalog() {
    const db = await getDb();
    await seedAchievements(db);
    const rows = await db.getAllAsync<{
      id: string;
      key: string;
      title: string;
      description: string;
      icon: string;
      criteria: string;
      is_custom: number;
      progress_style: string;
      unlock_mode: string;
    }>(`SELECT ${ACH_COLS} FROM achievement ORDER BY is_custom, key`);
    return rows.map(rowToAchievement);
  },

  async listUnlocked() {
    const db = await getDb();
    const profile = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_profile LIMIT 1');
    if (!profile) return [];
    const rows = await db.getAllAsync<{
      id: string;
      achievement_id: string;
      unlocked_at: string;
    }>('SELECT id, achievement_id, unlocked_at FROM achievement_unlock WHERE user_id = ?', profile.id);
    return rows.map(
      (r): AchievementUnlock => ({
        id: r.id,
        userId: profile.id,
        achievementId: r.achievement_id,
        unlockedAt: r.unlocked_at,
      }),
    );
  },

  async evaluateAndUnlock(event: AchievementEvent) {
    const db = await getDb();
    const before = await this.listUnlocked();
    await evaluateAchievementEvent(db, event);
    const after = await this.listUnlocked();
    const fresh = after.find((u) => !before.some((b) => b.id === u.id));
    if (!fresh) return null;
    return fresh;
  },

  /** HU-21 · F14 — medalla personalizada (is_custom = 1). */
  async createCustom(input) {
    const db = await getDb();
    const id = randomUUID();
    const key = `custom_${id.replace(/-/g, '').slice(0, 12)}`;
    await db.runAsync(
      `INSERT INTO achievement (id, key, title, description, icon, criteria, is_custom, progress_style, unlock_mode)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      id,
      key,
      input.title,
      input.description ?? '',
      input.icon,
      JSON.stringify(input.criteria),
      input.progressStyle,
      input.unlockMode,
    );
    const row = await db.getFirstAsync<Parameters<typeof rowToAchievement>[0]>(
      `SELECT ${ACH_COLS} FROM achievement WHERE id = ?`,
      id,
    );
    if (!row) throw new AppError(ERROR_CODES.INTERNAL, 'No se pudo crear la medalla');
    return rowToAchievement(row);
  },

  /** HU-23 — editar solo medallas propias; semillas → ACHIEVEMENT_SEED_IMMUTABLE. */
  async updateCustom(achievementId, input) {
    const db = await getDb();
    await assertCustom(db, achievementId);
    const sets: string[] = [];
    const args: (string | number)[] = [];
    if (input.title !== undefined) {
      sets.push('title = ?');
      args.push(input.title);
    }
    if (input.description !== undefined) {
      sets.push('description = ?');
      args.push(input.description);
    }
    if (input.icon !== undefined) {
      sets.push('icon = ?');
      args.push(input.icon);
    }
    if (input.criteria !== undefined) {
      sets.push('criteria = ?');
      args.push(JSON.stringify(input.criteria));
    }
    if (input.progressStyle !== undefined) {
      sets.push('progress_style = ?');
      args.push(input.progressStyle);
    }
    if (sets.length > 0) {
      args.push(achievementId);
      await db.runAsync(`UPDATE achievement SET ${sets.join(', ')} WHERE id = ?`, ...args);
    }
    const row = await db.getFirstAsync<Parameters<typeof rowToAchievement>[0]>(
      `SELECT ${ACH_COLS} FROM achievement WHERE id = ?`,
      achievementId,
    );
    if (!row) throw new AppError(ERROR_CODES.NOT_FOUND, 'Medalla no encontrada');
    return rowToAchievement(row);
  },

  /** HU-23 — eliminar medalla propia con confirmación (unlocks en CASCADE). */
  async removeCustom(achievementId) {
    const db = await getDb();
    await assertCustom(db, achievementId);
    await db.runAsync('DELETE FROM achievement WHERE id = ?', achievementId);
  },
};

export { randomUUID };
