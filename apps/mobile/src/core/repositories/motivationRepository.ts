import {
  AppError,
  CreateMotivationInput,
  ERROR_CODES,
  LIMITS,
  type CreateMotivationInputType,
} from '@habitos/shared';
import { randomUUID } from 'expo-crypto';
import { getDb } from '../data/database';
import type { Motivation, QueuedMotivation } from '../domain/entities/motivation';
import { MOTIVATION_QUEUE_MAX, pickQueue } from '../domain/services/motivationQueueService';

interface MotivationRow {
  id: string;
  user_id: string;
  text: string;
  emoji: string;
  goal_id: string | null;
  trigger_type: string;
  active: number;
  created_at: string;
  goal_title?: string | null;
}

function toMotivation(r: MotivationRow): Motivation {
  return {
    id: r.id,
    userId: r.user_id,
    text: r.text,
    emoji: r.emoji,
    goalId: r.goal_id,
    triggerType: r.trigger_type as Motivation['triggerType'],
    active: r.active === 1,
    createdAt: r.created_at,
  };
}

const COLS = `m.id, m.user_id, m.text, m.emoji, m.goal_id, m.trigger_type, m.active, m.created_at`;

async function profileId(): Promise<string> {
  const db = await getDb();
  const p = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_profile LIMIT 1');
  if (!p) throw new AppError(ERROR_CODES.NOT_FOUND, 'Perfil no encontrado');
  return p.id;
}

export const motivationRepository = {
  async list(): Promise<Motivation[]> {
    const db = await getDb();
    const userId = await profileId();
    const rows = await db.getAllAsync<MotivationRow>(
      `SELECT ${COLS} FROM motivation m WHERE m.user_id = ? AND m.active = 1 ORDER BY m.created_at DESC`,
      userId,
    );
    return rows.map(toMotivation);
  },

  /** HU-24 · F16 — alta con límite 50/usuario. */
  async create(input: CreateMotivationInputType): Promise<Motivation> {
    const parsed = CreateMotivationInput.parse(input);
    const db = await getDb();
    const userId = await profileId();

    const count = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM motivation WHERE user_id = ?',
      userId,
    );
    if ((count?.n ?? 0) >= LIMITS.MOTIVATION_MAX_PER_USER) {
      throw new AppError(
        ERROR_CODES.MOTIVATION_LIMIT,
        `Límite de ${LIMITS.MOTIVATION_MAX_PER_USER} motivaciones alcanzado`,
      );
    }

    const id = randomUUID();
    await db.runAsync(
      `INSERT INTO motivation (id, user_id, text, emoji, goal_id, trigger_type) VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      userId,
      parsed.text,
      parsed.emoji,
      parsed.goalId ?? null,
      parsed.triggerType,
    );
    const row = await db.getFirstAsync<MotivationRow>(`SELECT ${COLS} FROM motivation m WHERE m.id = ?`, id);
    if (!row) throw new AppError(ERROR_CODES.INTERNAL, 'No se pudo crear la motivación');
    return toMotivation(row);
  },

  async remove(motivationId: string): Promise<void> {
    const res = await (await getDb()).runAsync('DELETE FROM motivation WHERE id = ?', motivationId);
    if (res.changes === 0) throw new AppError(ERROR_CODES.NOT_FOUND, 'Motivación no encontrada');
  },

  /**
   * HU-25 · F17 — cola para Hoy. La selección vive en el servicio puro
   * motivationQueueService (≤5, excluye MOTIVATION_SHOW de hoy, meta primero).
   */
  async listQueue(today: string, limit = MOTIVATION_QUEUE_MAX): Promise<QueuedMotivation[]> {
    const db = await getDb();
    const userId = await profileId();
    const rows = await db.getAllAsync<MotivationRow>(
      `SELECT ${COLS}, g.title AS goal_title
       FROM motivation m
       LEFT JOIN goal g ON g.id = m.goal_id
       WHERE m.user_id = ? AND m.active = 1
       ORDER BY m.created_at DESC`,
      userId,
    );
    const shows = await db.getAllAsync<{ motivation_id: string }>(
      'SELECT motivation_id FROM motivation_show WHERE shown_on = ?',
      today,
    );
    const shownToday = new Set(shows.map((s) => s.motivation_id));
    const all = rows.map((r) => ({ ...toMotivation(r), goalTitle: r.goal_title ?? undefined }));
    return pickQueue(all, shownToday, limit);
  },

  /** HU-25 — registra que la card ya se enseñó hoy (no repetir). */
  async markShown(motivationId: string, shownOn: string): Promise<void> {
    await (await getDb()).runAsync(
      'INSERT OR IGNORE INTO motivation_show (motivation_id, shown_on) VALUES (?, ?)',
      motivationId,
      shownOn,
    );
  },

  /** HU-25 — «deshacer»: quita el registro de mostrada. */
  async unmarkShown(motivationId: string, shownOn: string): Promise<void> {
    await (await getDb()).runAsync(
      'DELETE FROM motivation_show WHERE motivation_id = ? AND shown_on = ?',
      motivationId,
      shownOn,
    );
  },
};
