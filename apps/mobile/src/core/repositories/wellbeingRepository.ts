import { AppError, ERROR_CODES, UpsertWellEntryInput } from '@habitos/shared';
import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../data/database';
import type { WellEntry } from '../domain/entities/wellEntry';
import type { WellbeingRepository } from '../domain/repositoryInterfaces';
import { evaluateAchievementEvent } from './achievementEvaluation';

interface WellRow {
  id: string;
  entry_date: string;
  mood: number;
  energy: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

function toEntry(r: WellRow): WellEntry {
  return {
    id: r.id,
    entryDate: r.entry_date,
    mood: r.mood,
    energy: r.energy,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    syncStatus: r.sync_status as WellEntry['syncStatus'],
  };
}

const WELL_COLS = 'id, entry_date, mood, energy, note, created_at, updated_at, sync_status';

export const wellbeingRepository: WellbeingRepository = {
  async upsertEntry(date, mood, energy, note) {
    const parsed = UpsertWellEntryInput.parse({ date, mood, energy, note });
    const db = await getDb();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO well_entry (id, entry_date, mood, energy, note) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(entry_date) DO UPDATE SET
           mood = excluded.mood, energy = excluded.energy,
           note = excluded.note, updated_at = datetime('now')`,
        randomUUID(),
        parsed.date,
        parsed.mood,
        parsed.energy,
        parsed.note ?? null,
      );
      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload) VALUES (?, 'well_entry', ?, 'update', ?)`,
        randomUUID(),
        parsed.date,
        JSON.stringify(parsed),
      );
      await evaluateAchievementEvent(db, { type: 'checkin_created', date: parsed.date });
    });

    const row = await db.getFirstAsync<WellRow>(
      `SELECT ${WELL_COLS} FROM well_entry WHERE entry_date = ?`,
      parsed.date,
    );
    if (!row) throw new AppError(ERROR_CODES.INTERNAL, 'Check-in no guardado');
    return toEntry(row);
  },

  async getEntry(date) {
    const db = await getDb();
    const row = await db.getFirstAsync<WellRow>(
      `SELECT ${WELL_COLS} FROM well_entry WHERE entry_date = ?`,
      date,
    );
    return row ? toEntry(row) : null;
  },

  async getMonth(year, month) {
    const db = await getDb();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const rows = await db.getAllAsync<WellRow>(
      `SELECT ${WELL_COLS} FROM well_entry WHERE entry_date LIKE ? ORDER BY entry_date`,
      `${prefix}-%`,
    );
    return rows.map(toEntry);
  },

  async countAll() {
    const db = await getDb();
    const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM well_entry');
    return r?.n ?? 0;
  },
};
