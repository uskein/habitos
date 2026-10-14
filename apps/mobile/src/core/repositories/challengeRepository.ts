import { AppError, CreateChallengeInput, ERROR_CODES } from '@habitos/shared';
import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../data/database';
import type { ChallengeWithHabit } from '../domain/entities/challenge';

/** Reto con hábito y check-ins distintos acumulados desde el inicio. */
export type ChallengeRow = ChallengeWithHabit & { completedDays: number };

const COLS = `c.id, c.name, c.habit_id, c.days, c.start_date, c.status, c.created_at,
  h.name AS habit_name, h.icon AS habit_icon,
  (SELECT COUNT(DISTINCT l.log_date) FROM habit_log l
    WHERE l.habit_id = c.habit_id AND l.completed = 1
      AND l.log_date >= c.start_date) AS completed_days`;

function toRow(r: Record<string, unknown>): ChallengeRow {
  return {
    id: r.id as string,
    name: r.name as string,
    habitId: r.habit_id as string,
    days: r.days as number,
    startDate: r.start_date as string,
    status: r.status as 'active' | 'completed',
    createdAt: r.created_at as string,
    habitName: r.habit_name as string,
    habitIcon: r.habit_icon as string,
    completedDays: r.completed_days as number,
  };
}

async function profileId(db: SQLiteDatabase): Promise<string> {
  const p = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_profile LIMIT 1');
  if (!p) throw new AppError(ERROR_CODES.NOT_FOUND, 'Perfil no encontrado');
  return p.id;
}

export const challengeRepository = {
  /** Retos activos del usuario con progreso (M36). */
  async listActive(): Promise<ChallengeRow[]> {
    const db = await getDb();
    const userId = await profileId(db);
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT ${COLS}
       FROM challenge c JOIN habit h ON h.id = c.habit_id
       WHERE c.user_id = ? AND c.status = 'active'
       ORDER BY c.created_at DESC`,
      userId,
    );
    return rows.map(toRow);
  },

  /** Crea un reto validado con Zod sobre el hábito indicado (debe estar activo). */
  async create(input: unknown): Promise<string> {
    const parsed = CreateChallengeInput.parse(input);
    const db = await getDb();
    const userId = await profileId(db);

    const habit = await db.getFirstAsync<{ id: string; is_archived: number }>(
      'SELECT id, is_archived FROM habit WHERE id = ?',
      parsed.habitId,
    );
    if (!habit || habit.is_archived === 1) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'El hábito no está disponible');
    }

    const id = randomUUID();
    await db.runAsync(
      `INSERT INTO challenge (id, user_id, name, habit_id, days, start_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      userId,
      parsed.name,
      parsed.habitId,
      parsed.days,
      new Date().toISOString().slice(0, 10),
    );
    return id;
  },

  /** Marca un reto como completado (archivo manual tras la celebración). */
  async markCompleted(challengeId: string): Promise<void> {
    const db = await getDb();
    const res = await db.runAsync(
      `UPDATE challenge SET status = 'completed' WHERE id = ?`,
      challengeId,
    );
    if (res.changes === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Reto no encontrado');
    }
  },

  /** Abandona/borra un reto activo. */
  async remove(challengeId: string): Promise<void> {
    const db = await getDb();
    const res = await db.runAsync('DELETE FROM challenge WHERE id = ?', challengeId);
    if (res.changes === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Reto no encontrado');
    }
  },
};
