import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrator';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** SSOT de conexión — abre con pragmas de rendimiento/integridad. */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('habitos.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        PRAGMA busy_timeout = 5000;
      `);
      await runMigrations(db);
      return db;
    })();
  }
  return dbPromise;
}
