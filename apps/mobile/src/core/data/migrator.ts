import type { SQLiteDatabase } from 'expo-sqlite';
import * as m001 from './migrations/001_initial';
import * as m002 from './migrations/002_v2';

interface Migration {
  version: number;
  name: string;
  sql: string;
}

/** Registry — orden ascendente obligatorio; nunca editar una ya aplicada. */
const MIGRATIONS: Migration[] = [m001, m002];

/**
 * Migrador versionado ligero (tabla _migrations).
 * Cumple MODELO_DE_DATOS §5: aplicada en arranque, versionada en git.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,
  );

  const applied = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM _migrations ORDER BY version',
  );
  const appliedSet = new Set(applied.map((r) => r.version));

  for (const m of MIGRATIONS) {
    if (appliedSet.has(m.version)) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(m.sql);
      await db.runAsync('INSERT INTO _migrations (version, name) VALUES (?, ?)', m.version, m.name);
    });
  }
}
