import { AppError, CreateGoalInput, deviceHour, ERROR_CODES, localDateISO } from '@habitos/shared';
import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../data/database';
import type { Goal, GoalStatus, GoalUpdate } from '../domain/entities/goal';
import type { GoalRepository } from '../domain/repositoryInterfaces';

interface GoalRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_value: number;
  current_value: number;
  unit: string | null;
  deadline: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

function toGoal(r: GoalRow): Goal {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    targetValue: r.target_value,
    currentValue: r.current_value,
    unit: r.unit,
    deadline: r.deadline,
    status: r.status as GoalStatus,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    syncStatus: r.sync_status as Goal['syncStatus'],
  };
}

const GOAL_COLS = `id, title, description, category, target_value, current_value, unit,
  deadline, status, created_at, updated_at, sync_status`;

async function recomputeIfDone(db: SQLiteDatabase, goalId: string): Promise<void> {
  const g = await db.getFirstAsync<{ target_value: number; current_value: number; status: string }>(
    'SELECT target_value, current_value, status FROM goal WHERE id = ?',
    goalId,
  );
  if (!g) return;
  if (g.status === 'active' && g.current_value >= g.target_value) {
    await db.runAsync(
      `UPDATE goal SET status = 'completed', updated_at = datetime('now') WHERE id = ?`,
      goalId,
    );
    const { evaluateAchievementEvent } = await import('./achievementEvaluation');
    await evaluateAchievementEvent(db, { type: 'goal_completed', goalId });
  }
}

export const goalRepository: GoalRepository = {
  async list(status) {
    const db = await getDb();
    const rows = status
      ? await db.getAllAsync<GoalRow>(
          `SELECT ${GOAL_COLS} FROM goal WHERE status = ? ORDER BY created_at DESC`,
          status,
        )
      : await db.getAllAsync<GoalRow>(
          `SELECT ${GOAL_COLS} FROM goal ORDER BY created_at DESC`,
        );
    return rows.map(toGoal);
  },

  async getById(goalId) {
    const db = await getDb();
    const row = await db.getFirstAsync<GoalRow>(`SELECT ${GOAL_COLS} FROM goal WHERE id = ?`, goalId);
    return row ? toGoal(row) : null;
  },

  async create(input) {
    const parsed = CreateGoalInput.parse(input);
    const db = await getDb();
    const id = randomUUID();
    await db.runAsync(
      `INSERT INTO goal (id, title, target_value, unit, deadline) VALUES (?, ?, ?, ?, ?)`,
      id,
      parsed.title,
      parsed.targetValue,
      parsed.unit ?? null,
      parsed.dueDate ?? null,
    );
    const created = await this.getById(id);
    if (!created) throw new AppError(ERROR_CODES.INTERNAL, 'No se pudo crear la meta');
    return created;
  },

  async addProgress(goalId, delta, note) {
    const db = await getDb();
    const goal = await this.getById(goalId);
    if (!goal) throw new AppError(ERROR_CODES.NOT_FOUND, 'Meta no encontrada');
    if (goal.status !== 'active') {
      throw new AppError(ERROR_CODES.CONFLICT, 'La meta ya no está activa');
    }

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO goal_update (id, goal_id, delta, note, entry_date) VALUES (?, ?, ?, ?, date('now'))`,
        randomUUID(),
        goalId,
        delta,
        note ?? null,
      );
      await db.runAsync(
        `UPDATE goal SET current_value = MAX(0, current_value + ?), updated_at = datetime('now')
         WHERE id = ?`,
        delta,
        goalId,
      );
      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload) VALUES (?, 'goal_update', ?, 'create', ?)`,
        randomUUID(),
        goalId,
        JSON.stringify({ goalId, delta, note }),
      );
      await recomputeIfDone(db, goalId);
    });

    const updated = await this.getById(goalId);
    if (!updated) throw new AppError(ERROR_CODES.NOT_FOUND, 'Meta no encontrada');
    return updated;
  },

  async setStatus(goalId, status) {
    const db = await getDb();
    const res = await db.runAsync(
      `UPDATE goal SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      status,
      goalId,
    );
    if (res.changes === 0) throw new AppError(ERROR_CODES.NOT_FOUND, 'Meta no encontrada');
    if (status === 'completed') {
      await db.withTransactionAsync(async () => {
        const { evaluateAchievementEvent } = await import('./achievementEvaluation');
        await evaluateAchievementEvent(db, { type: 'goal_completed', goalId });
      });
    }
    return (await this.getById(goalId))!;
  },

  async delete(goalId) {
    const db = await getDb();
    const res = await db.runAsync('DELETE FROM goal WHERE id = ?', goalId);
    if (res.changes === 0) throw new AppError(ERROR_CODES.NOT_FOUND, 'Meta no encontrada');
  },

  /** V2 · HU-19 — historial de progresos (más reciente primero). */
  async getUpdates(goalId) {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      goal_id: string;
      delta: number;
      note: string | null;
      entry_date: string;
      created_at: string;
    }>(
      `SELECT id, goal_id, delta, note, entry_date, created_at FROM goal_update
       WHERE goal_id = ? ORDER BY entry_date DESC, created_at DESC`,
      goalId,
    );
    return rows.map<GoalUpdate>((r) => ({
      id: r.id,
      goalId: r.goal_id,
      delta: r.delta,
      note: r.note,
      entryDate: r.entry_date,
      createdAt: r.created_at,
    }));
  },

  /** V2 · HU-19 — editar nota en la misma transacción GOAL_UPDATE (tx + outbox). */
  async updateNote(updateId, note) {
    const db = await getDb();
    const trimmed = note.trim();
    await db.withTransactionAsync(async () => {
      const res = await db.runAsync(
        'UPDATE goal_update SET note = ? WHERE id = ?',
        trimmed || null,
        updateId,
      );
      if (res.changes === 0) throw new AppError(ERROR_CODES.NOT_FOUND, 'Registro no encontrado');
      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload) VALUES (?, 'goal_update', ?, 'update', ?)`,
        randomUUID(),
        updateId,
        JSON.stringify({ note: trimmed }),
      );
    });
    const row = await db.getFirstAsync<{
      id: string;
      goal_id: string;
      delta: number;
      note: string | null;
      entry_date: string;
      created_at: string;
    }>(`SELECT id, goal_id, delta, note, entry_date, created_at FROM goal_update WHERE id = ?`, updateId);
    if (!row) throw new AppError(ERROR_CODES.NOT_FOUND, 'Registro no encontrado');
    return {
      id: row.id,
      goalId: row.goal_id,
      delta: row.delta,
      note: row.note,
      entryDate: row.entry_date,
      createdAt: row.created_at,
    };
  },

  /** V2 · HU-20 — 7 días (suma deltas) + distribución por hora (hora pico). */
  async getStats(goalId) {
    const db = await getDb();
    const rows = await db.getAllAsync<{ entry_date: string; delta: number; created_at: string }>(
      `SELECT entry_date, delta, created_at FROM goal_update WHERE goal_id = ?`,
      goalId,
    );
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const iso = localDateISO(d);
      return {
        date: iso,
        label: d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 2).toLowerCase(),
        total: 0,
      };
    });
    const byDate = new Map(days.map((d) => [d.date, d]));
    const hourly = new Array<number>(24).fill(0);
    for (const r of rows) {
      const day = byDate.get(r.entry_date);
      if (day) day.total += r.delta;
      const hour = deviceHour(r.created_at);
      if (hour !== null) hourly[hour] = (hourly[hour] ?? 0) + 1;
    }
    return { daily: days, hourly, updates: rows.length };
  },
};
