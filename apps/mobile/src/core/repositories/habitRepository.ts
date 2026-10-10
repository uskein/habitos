import { AppError, CreateHabitInput, ERROR_CODES, localDateISO } from '@habitos/shared';
import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../data/database';
import type {
  Habit,
  HabitLog,
  HabitWithLog,
} from '../domain/entities/habit';
import type { HabitRepository } from '../domain/repositoryInterfaces';
import { computeGlobalStreak, computeStreak } from '../domain/services/streakCalculator';
import { evaluateAchievementEvent } from './achievementEvaluation';

interface HabitRow {
  id: string;
  name: string;
  icon: string;
  category: string;
  color_token: string;
  frequency: string;
  custom_days: string | null;
  target_value: number | null;
  unit: string | null;
  reminder_time: string | null;
  sort_order: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

interface LogRow {
  id: string;
  habit_id: string;
  log_date: string;
  completed: number;
  value: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

interface FeedRow extends HabitRow {
  l_id: string | null;
  l_habit_id: string | null;
  l_log_date: string | null;
  l_completed: number | null;
  l_value: number | null;
  l_completed_at: string | null;
  l_created_at: string | null;
  l_updated_at: string | null;
  l_sync_status: string | null;
}

function toHabit(r: HabitRow): Habit {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    category: r.category as Habit['category'],
    colorToken: r.color_token,
    frequency: r.frequency as Habit['frequency'],
    customDays: r.custom_days ? (JSON.parse(r.custom_days) as number[]) : null,
    targetValue: r.target_value,
    unit: r.unit,
    reminderTime: r.reminder_time,
    sortOrder: r.sort_order,
    isArchived: r.is_archived === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    syncStatus: r.sync_status as Habit['syncStatus'],
  };
}

function toLog(r: LogRow): HabitLog {
  return {
    id: r.id,
    habitId: r.habit_id,
    logDate: r.log_date,
    completed: r.completed === 1,
    value: r.value,
    completedAt: r.completed_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    syncStatus: r.sync_status as HabitLog['syncStatus'],
  };
}

const HABIT_COLS = `id, name, icon, category, color_token, frequency, custom_days,
  target_value, unit, reminder_time, sort_order, is_archived, created_at, updated_at, sync_status`;

const LOG_COLS = `id, habit_id, log_date, completed, value, completed_at, created_at, updated_at, sync_status`;

async function recomputeStreaks(db: SQLiteDatabase, habitId: string): Promise<void> {
  const today = localDateISO();

  const habitDates = await db.getAllAsync<{ log_date: string }>(
    `SELECT log_date FROM habit_log WHERE habit_id = ? AND completed = 1 ORDER BY log_date`,
    habitId,
  );
  const h = computeStreak(
    habitDates.map((r) => r.log_date),
    today,
  );
  await db.runAsync(
    `INSERT INTO habit_streak_cache (habit_id, current_streak, best_streak, last_completed_date, recomputed_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(habit_id) DO UPDATE SET
       current_streak = MAX(current_streak, excluded.current_streak),
       best_streak = MAX(best_streak, excluded.best_streak),
       last_completed_date = excluded.last_completed_date,
       recomputed_at = excluded.recomputed_at`,
    habitId,
    h.currentStreak,
    h.bestStreak,
    h.lastCompletedDate,
  );

  const profile = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_profile LIMIT 1');
  if (!profile) return;

  const allDates = await db.getAllAsync<{ log_date: string }>(
    `SELECT DISTINCT log_date FROM habit_log WHERE completed = 1 ORDER BY log_date`,
  );
  const g = computeGlobalStreak(
    allDates.map((r) => r.log_date),
    today,
  );
  await db.runAsync(
    `INSERT INTO streak_cache (user_id, global_current_streak, global_best_streak, recomputed_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       global_current_streak = excluded.global_current_streak,
       global_best_streak = MAX(streak_cache.global_best_streak, excluded.global_best_streak),
       recomputed_at = excluded.recomputed_at`,
    profile.id,
    g.currentStreak,
    g.bestStreak,
  );
}

export const habitRepository: HabitRepository = {
  async listByDate(date) {
    const db = await getDb();
    const rows = await db.getAllAsync<FeedRow>(
      `SELECT h.id, h.name, h.icon, h.category, h.color_token, h.frequency, h.custom_days,
              h.target_value, h.unit, h.reminder_time, h.sort_order, h.is_archived,
              h.created_at, h.updated_at, h.sync_status,
              l.id AS l_id, l.habit_id AS l_habit_id, l.log_date AS l_log_date,
              l.completed AS l_completed, l.value AS l_value, l.completed_at AS l_completed_at,
              l.created_at AS l_created_at, l.updated_at AS l_updated_at, l.sync_status AS l_sync_status
       FROM habit h
       LEFT JOIN habit_log l ON l.habit_id = h.id AND l.log_date = ?
       WHERE h.is_archived = 0
       ORDER BY h.sort_order, h.created_at`,
      date,
    );

    return rows.map((r) => {
      const habit = toHabit(r);
      const log =
        r.l_id && r.l_log_date
          ? toLog({
              id: r.l_id,
              habit_id: r.l_habit_id ?? r.id,
              log_date: r.l_log_date,
              completed: r.l_completed ?? 0,
              value: r.l_value ?? null,
              completed_at: r.l_completed_at ?? null,
              created_at: r.l_created_at ?? '',
              updated_at: r.l_updated_at ?? '',
              sync_status: r.l_sync_status ?? 'pending',
            })
          : null;
      return { ...habit, log } satisfies HabitWithLog;
    });
  },

  async getById(habitId) {
    const db = await getDb();
    const row = await db.getFirstAsync<HabitRow>(
      `SELECT ${HABIT_COLS} FROM habit WHERE id = ?`,
      habitId,
    );
    return row ? toHabit(row) : null;
  },

  async create(input) {
    const parsed = CreateHabitInput.parse(input);
    const db = await getDb();
    const id = randomUUID();

    const max = await db.getFirstAsync<{ m: number | null }>(
      'SELECT MAX(sort_order) AS m FROM habit',
    );
    const sortOrder = (max?.m ?? -1) + 1;

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO habit (id, name, icon, category, color_token, frequency, custom_days,
           target_value, unit, reminder_time, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        parsed.name,
        parsed.icon,
        parsed.category,
        parsed.colorToken,
        parsed.frequency,
        parsed.customDays ? JSON.stringify(parsed.customDays) : null,
        parsed.targetValue ?? null,
        parsed.unit ?? null,
        parsed.reminderTime ?? null,
        sortOrder,
      );
      await db.runAsync(
        `INSERT INTO habit_streak_cache (habit_id) VALUES (?) ON CONFLICT DO NOTHING`,
        id,
      );
      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload) VALUES (?, 'habit', ?, 'create', ?)`,
        randomUUID(),
        id,
        JSON.stringify({ ...parsed, id }),
      );
      await evaluateAchievementEvent(db, { type: 'habit_created', habitId: id });
    });

    const created = await this.getById(id);
    if (!created) throw new AppError(ERROR_CODES.INTERNAL, 'No se pudo crear el hábito');
    return created;
  },

  async update(habitId, input) {
    const db = await getDb();
    const existing = await this.getById(habitId);
    if (!existing) throw new AppError(ERROR_CODES.NOT_FOUND, 'Hábito no encontrado');

    const merged = { ...existing, ...input };
    const parsed = CreateHabitInput.parse({
      name: merged.name,
      icon: merged.icon,
      category: merged.category,
      colorToken: merged.colorToken,
      frequency: merged.frequency,
      customDays: merged.customDays ?? undefined,
      targetValue: merged.targetValue,
      unit: merged.unit,
      reminderTime: merged.reminderTime,
    });

    await db.runAsync(
      `UPDATE habit SET name = ?, icon = ?, category = ?, color_token = ?, frequency = ?,
         custom_days = ?, target_value = ?, unit = ?, reminder_time = ?, updated_at = datetime('now')
       WHERE id = ?`,
      parsed.name,
      parsed.icon,
      parsed.category,
      parsed.colorToken,
      parsed.frequency,
      parsed.customDays ? JSON.stringify(parsed.customDays) : null,
      parsed.targetValue ?? null,
      parsed.unit ?? null,
      parsed.reminderTime ?? null,
      habitId,
    );
    return (await this.getById(habitId))!;
  },

  async toggleLog(habitId, date) {
    const db = await getDb();
    const habit = await this.getById(habitId);
    if (!habit) throw new AppError(ERROR_CODES.NOT_FOUND, 'Hábito no encontrado');

    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      const existing = await db.getFirstAsync<LogRow>(
        `SELECT ${LOG_COLS} FROM habit_log WHERE habit_id = ? AND log_date = ?`,
        habitId,
        date,
      );

      if (existing) {
        const completed = existing.completed === 0;
        await db.runAsync(
          `UPDATE habit_log SET completed = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
          completed ? 1 : 0,
          completed ? now : null,
          now,
          existing.id,
        );
        await db.runAsync(
          `INSERT INTO outbox (id, entity, entity_id, op, payload) VALUES (?, 'habit_log', ?, ?, ?)`,
          randomUUID(),
          existing.id,
          completed ? 'create' : 'update',
          JSON.stringify({ habitId, logDate: date, completed }),
        );
      } else {
        const id = randomUUID();
        await db.runAsync(
          `INSERT INTO habit_log (id, habit_id, log_date, completed, completed_at, updated_at)
           VALUES (?, ?, ?, 1, ?, ?)`,
          id,
          habitId,
          date,
          now,
          now,
        );
        await db.runAsync(
          `INSERT INTO outbox (id, entity, entity_id, op, payload) VALUES (?, 'habit_log', ?, 'create', ?)`,
          randomUUID(),
          id,
          JSON.stringify({ habitId, logDate: date, completed: true }),
        );
      }

      await recomputeStreaks(db, habitId);
      await evaluateAchievementEvent(db, { type: 'habit_completed', habitId, date });
    });

    const log = await db.getFirstAsync<LogRow>(
      `SELECT ${LOG_COLS} FROM habit_log WHERE habit_id = ? AND log_date = ?`,
      habitId,
      date,
    );
    if (!log) throw new AppError(ERROR_CODES.INTERNAL, 'toggleLog: log no encontrado tras upsert');
    return toLog(log);
  },

  async getHistory(habitId, from, to) {
    const db = await getDb();
    const rows = await db.getAllAsync<LogRow>(
      `SELECT ${LOG_COLS} FROM habit_log
       WHERE habit_id = ? AND log_date >= ? AND log_date <= ? ORDER BY log_date DESC`,
      habitId,
      from,
      to,
    );
    return rows.map(toLog);
  },

  async archive(habitId) {
    const db = await getDb();
    const res = await db.runAsync(
      `UPDATE habit SET is_archived = 1, updated_at = datetime('now') WHERE id = ?`,
      habitId,
    );
    if (res.changes === 0) throw new AppError(ERROR_CODES.NOT_FOUND, 'Hábito no encontrado');
  },

  async delete(habitId) {
    const db = await getDb();
    const res = await db.runAsync(`DELETE FROM habit WHERE id = ?`, habitId);
    if (res.changes === 0) throw new AppError(ERROR_CODES.NOT_FOUND, 'Hábito no encontrado');
  },
};
