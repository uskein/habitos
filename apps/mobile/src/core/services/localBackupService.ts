import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { getDb } from '../data/database';

/**
 * M46 · backup automático local del .db — al arrancar la app:
 * 1) `PRAGMA wal_checkpoint(TRUNCATE)` — vuelca el WAL en el archivo principal.
 * 2) copia `Documents/backups/habitos-YYYY-MM-DD.db` (una copia por día).
 * 3) rotación: conserva solo las MAX_COPIES más recientes.
 *
 * Best-effort: cualquier error se ignora — nunca debe romper el arranque.
 * NOTA: vive en el sandbox de la app; para sobrevivir a una desinstalación
 * sigue siendo la referencia el backup cifrado `.habitos` (Ajustes).
 */
const MAX_COPIES = 3;
const BACKUP_PREFIX = 'habitos-';
const BACKUP_EXT = '.db';

export async function autoBackupDatabase(): Promise<void> {
  try {
    const db = await getDb();
    await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');

    const dir = new Directory(Paths.document, 'backups');
    if (!dir.exists) dir.create({ intermediates: true });

    const day = new Date().toISOString().slice(0, 10);
    const dest = new File(dir, `${BACKUP_PREFIX}${day}${BACKUP_EXT}`);
    if (dest.exists) return; // ya hay copia de hoy

    const src = new File(`${String(SQLite.defaultDatabaseDirectory)}`, 'habitos.db');
    if (!src.exists) return;

    dest.write(await src.bytes());

    // Rotación: nombres fechas ISO → orden lexicográfico = cronológico.
    const backups = dir
      .list()
      .filter(
        (entry): entry is File =>
          entry instanceof File &&
          entry.name.startsWith(BACKUP_PREFIX) &&
          entry.name.endsWith(BACKUP_EXT),
      )
      .sort((a, b) => b.name.localeCompare(a.name));
    for (const stale of backups.slice(MAX_COPIES)) stale.delete();
  } catch {
    /* best-effort */
  }
}
