import {
  AppError,
  CreateMilestoneInput,
  ERROR_CODES,
  LIMITS,
  type CreateMilestoneInputType,
} from '@habitos/shared';
import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { deleteImages } from '../data/imageStore';
import { getDb } from '../data/database';
import type { Milestone, MilestoneImage, MilestoneLink, MilestoneWithMedia } from '../domain/entities/milestone';

interface MilestoneRow {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  occurred_at: string;
  created_at: string;
  sync_state: string;
}

function toMilestone(r: MilestoneRow): Milestone {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    note: r.note,
    occurredAt: r.occurred_at,
    createdAt: r.created_at,
    syncState: r.sync_state as Milestone['syncState'],
  };
}

const COLS = 'id, user_id, title, note, occurred_at, created_at, sync_state';

async function loadMedia(db: SQLiteDatabase, milestoneId: string) {
  const images = await db.getAllAsync<{
    id: string;
    milestone_id: string;
    uri: string;
    position: number;
  }>('SELECT id, milestone_id, uri, position FROM milestone_image WHERE milestone_id = ? ORDER BY position', milestoneId);
  const links = await db.getAllAsync<{
    milestone_id: string;
    entity_type: string;
    entity_id: string;
  }>('SELECT milestone_id, entity_type, entity_id FROM milestone_link WHERE milestone_id = ?', milestoneId);
  return {
    images: images.map<MilestoneImage>((r) => ({
      id: r.id,
      milestoneId: r.milestone_id,
      uri: r.uri,
      position: r.position,
    })),
    links: links.map<MilestoneLink>((r) => ({
      milestoneId: r.milestone_id,
      entityType: r.entity_type as MilestoneLink['entityType'],
      entityId: r.entity_id,
    })),
  };
}

async function profileId(db: SQLiteDatabase): Promise<string> {
  const p = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_profile LIMIT 1');
  if (!p) throw new AppError(ERROR_CODES.NOT_FOUND, 'Perfil no encontrado');
  return p.id;
}

export const milestoneRepository = {
  async list(): Promise<MilestoneWithMedia[]> {
    const db = await getDb();
    const userId = await profileId(db);
    const rows = await db.getAllAsync<MilestoneRow>(
      `SELECT ${COLS} FROM milestone WHERE user_id = ? ORDER BY occurred_at DESC`,
      userId,
    );
    const result: MilestoneWithMedia[] = [];
    for (const row of rows) {
      result.push({ ...toMilestone(row), ...(await loadMedia(db, row.id)) });
    }
    return result;
  },

  async getById(milestoneId: string): Promise<MilestoneWithMedia | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<MilestoneRow>(`SELECT ${COLS} FROM milestone WHERE id = ?`, milestoneId);
    if (!row) return null;
    return { ...toMilestone(row), ...(await loadMedia(db, milestoneId)) };
  },

  /** HU-17 · F12 — alta transaccional hito + imágenes + ligazones (MODELO §2.8). */
  async create(input: CreateMilestoneInputType): Promise<MilestoneWithMedia> {
    const parsed = CreateMilestoneInput.parse(input);
    if (parsed.imageUris.length > LIMITS.MILESTONE_IMAGES_MAX) {
      throw new AppError(
        ERROR_CODES.MILESTONE_IMAGE_LIMIT,
        `Máximo ${LIMITS.MILESTONE_IMAGES_MAX} imágenes por hito`,
      );
    }
    const db = await getDb();
    const userId = await profileId(db);
    const id = randomUUID();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO milestone (id, user_id, title, note, occurred_at) VALUES (?, ?, ?, ?, ?)`,
        id,
        userId,
        parsed.title,
        parsed.note ?? null,
        parsed.occurredAt,
      );
      for (let i = 0; i < parsed.imageUris.length; i++) {
        const uri = parsed.imageUris[i];
        if (!uri) continue;
        await db.runAsync(
          'INSERT INTO milestone_image (id, milestone_id, uri, position) VALUES (?, ?, ?, ?)',
          randomUUID(),
          id,
          uri,
          i,
        );
      }
      for (const link of parsed.links) {
        await db.runAsync(
          'INSERT OR IGNORE INTO milestone_link (milestone_id, entity_type, entity_id) VALUES (?, ?, ?)',
          id,
          link.entityType,
          link.entityId,
        );
      }
      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload) VALUES (?, 'milestone', ?, 'create', ?)`,
        randomUUID(),
        id,
        JSON.stringify({ title: parsed.title }),
      );
    });

    const created = await this.getById(id);
    if (!created) throw new AppError(ERROR_CODES.INTERNAL, 'No se pudo crear el hito');
    return created;
  },

  /** HU-18 — comentario ≤500 (nota del hito). */
  async setComment(milestoneId: string, note: string): Promise<MilestoneWithMedia> {
    const res = await (await getDb()).runAsync(
      `UPDATE milestone SET note = ?, sync_state = 'pending' WHERE id = ?`,
      note,
      milestoneId,
    );
    if (res.changes === 0) throw new AppError(ERROR_CODES.NOT_FOUND, 'Hito no encontrado');
    const updated = await this.getById(milestoneId);
    if (!updated) throw new AppError(ERROR_CODES.NOT_FOUND, 'Hito no encontrado');
    return updated;
  },

  /** HU-18 · F13 borde — borra en tx y limpia FileSystem (nada de huérfanos). */
  async remove(milestoneId: string): Promise<void> {
    const db = await getDb();
    const media = await loadMedia(db, milestoneId);
    await db.withTransactionAsync(async () => {
      const res = await db.runAsync('DELETE FROM milestone WHERE id = ?', milestoneId);
      if (res.changes === 0) throw new AppError(ERROR_CODES.NOT_FOUND, 'Hito no encontrado');
      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload) VALUES (?, 'milestone', ?, 'delete', '{}')`,
        randomUUID(),
        milestoneId,
      );
    });
    deleteImages(media.images.map((i) => i.uri));
  },

  /** HU-18 — hitos ligados a un hábito o meta (acceso cruzado). */
  async listByEntity(entityType: 'habit' | 'goal', entityId: string): Promise<MilestoneWithMedia[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<MilestoneRow>(
      `SELECT m.id, m.user_id, m.title, m.note, m.occurred_at, m.created_at, m.sync_state
       FROM milestone m
       JOIN milestone_link l ON l.milestone_id = m.id
       WHERE l.entity_type = ? AND l.entity_id = ?
       ORDER BY m.occurred_at DESC`,
      entityType,
      entityId,
    );
    const result: MilestoneWithMedia[] = [];
    for (const row of rows) {
      result.push({ ...toMilestone(row), ...(await loadMedia(db, row.id)) });
    }
    return result;
  },
};
