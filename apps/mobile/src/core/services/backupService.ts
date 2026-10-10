import { AppError, BackupPayload, BACKUP_VERSION, ERROR_CODES } from '@habitos/shared';
import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { getDb } from '../data/database';
import { base64ToBytes, bytesToBase64, decryptJson, encryptJson } from './backupCrypto';

/**
 * backupService — HU-28 · M24 (contrato: agregado interno, NO toca repositoryInterfaces).
 *
 * exportEncrypted(password): JSON con TODOS los datos del usuario + fotos en base64,
 *   cifrado (scrypt + AES-256-GCM) → archivo `.habitos` en cache (para compartir).
 * importEncrypted(uri, password): descifra → validación Zod COMPLETA → fotos nuevas →
 *   transacción con rollback total → la app queda en el estado importado.
 */

type Row = Record<string, unknown>;

const PHOTOS_DIR = new Directory(Paths.document, 'photos');

async function selectAll(db: Awaited<ReturnType<typeof getDb>>, table: string): Promise<Row[]> {
  // `table` es constante interna — nunca input del usuario.
  return (await db.getAllAsync(`SELECT * FROM ${table}`)) as Row[];
}

function mapUri(map: Map<string, string>, uri: string | null): string | null {
  if (!uri) return uri;
  return map.get(uri) ?? uri;
}

export const backupService = {
  /** Genera el archivo cifrado y devuelve su URI (la pantalla abre el sheet nativo). */
  async exportEncrypted(password: string): Promise<string> {
    if (password.length < 4) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'La contraseña debe tener al menos 4 caracteres');
    }

    const db = await getDb();
    const profile = (await db.getFirstAsync('SELECT * FROM user_profile LIMIT 1')) as Row | null;
    if (!profile) throw new AppError(ERROR_CODES.NOT_FOUND, 'No hay perfil que respaldar');

    const [
      habits,
      habitLogs,
      goals,
      goalUpdates,
      wellEntries,
      achievements,
      achievementUnlocks,
      milestones,
      milestoneImages,
      milestoneLinks,
      motivations,
      motivationShows,
      streakFreezes,
    ] = await Promise.all([
      selectAll(db, 'habit'),
      selectAll(db, 'habit_log'),
      selectAll(db, 'goal'),
      selectAll(db, 'goal_update'),
      selectAll(db, 'well_entry'),
      selectAll(db, 'achievement'),
      selectAll(db, 'achievement_unlock'),
      selectAll(db, 'milestone'),
      selectAll(db, 'milestone_image'),
      selectAll(db, 'milestone_link'),
      selectAll(db, 'motivation'),
      selectAll(db, 'motivation_show'),
      selectAll(db, 'streak_freeze'),
    ]);

    // Fotos (avatar + hitos) → base64 dentro del JSON cifrado.
    const photoUris = new Set<string>();
    const avatar = profile.photo_uri as string | null;
    if (avatar) photoUris.add(avatar);
    for (const mi of milestoneImages) photoUris.add(mi.uri as string);

    const photos: { uri: string; data: string }[] = [];
    for (const uri of photoUris) {
      const file = new File(uri);
      if (file.exists) photos.push({ uri, data: bytesToBase64(await file.bytes()) });
    }

    const payload = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      profile,
      habits,
      habitLogs,
      goals,
      goalUpdates,
      wellEntries,
      achievements,
      achievementUnlocks,
      milestones,
      milestoneImages,
      milestoneLinks,
      motivations,
      motivationShows,
      streakFreezes,
      photos,
    };

    BackupPayload.parse(payload); // el export también debe ser importable

    const bytes = encryptJson(payload, password);
    const dir = new Directory(Paths.cache, 'backups');
    if (!dir.exists) dir.create({ intermediates: true });
    const stamp = new Date().toISOString().slice(0, 10);
    const file = new File(dir, `habitos-backup-${stamp}.habitos`);
    file.write(bytes);
    return file.uri;
  },

  /** Restaura desde archivo. Errores R9: BACKUP_PASSWORD_INVALID / BACKUP_CORRUPT. */
  async importEncrypted(uri: string, password: string): Promise<void> {
    const file = new File(uri);
    if (!file.exists) {
      throw new AppError(ERROR_CODES.BACKUP_CORRUPT, 'No se pudo leer el archivo');
    }
    const bytes = await file.bytes();

    const parsed = decryptJson(bytes, password);
    const check = BackupPayload.safeParse(parsed);
    if (!check.success) {
      throw new AppError(ERROR_CODES.BACKUP_CORRUPT, 'Estructura del backup inválida');
    }
    const data = check.data;

    // 1) Fotos nuevas (UUID anti path-traversal) con mapeo oldUri → newUri.
    if (!PHOTOS_DIR.exists) PHOTOS_DIR.create({ intermediates: true });
    const remap = new Map<string, string>();
    const written: string[] = [];
    try {
      for (const photo of data.photos) {
        const target = new File(PHOTOS_DIR, `${randomUUID()}.jpg`);
        target.write(base64ToBytes(photo.data));
        written.push(target.uri);
        remap.set(photo.uri, target.uri);
      }

      // 2) Transacción con rollback total (expo-sqlite revierte si el callback lanza).
      const db = await getDb();
      await db.withTransactionAsync(async () => {
        // Limpieza defensiva (FK pueden estar off): hijas → derivadas → profile.
        await db.runAsync('DELETE FROM motivation_show');
        await db.runAsync('DELETE FROM motivation');
        await db.runAsync('DELETE FROM streak_freeze');
        await db.runAsync('DELETE FROM milestone_link');
        await db.runAsync('DELETE FROM milestone_image');
        await db.runAsync('DELETE FROM achievement_unlock');
        await db.runAsync('DELETE FROM goal_update');
        await db.runAsync('DELETE FROM habit_log');
        await db.runAsync('DELETE FROM well_entry');
        await db.runAsync('DELETE FROM milestone');
        await db.runAsync('DELETE FROM goal');
        await db.runAsync('DELETE FROM habit');
        await db.runAsync('DELETE FROM achievement WHERE is_custom = 1');
        await db.runAsync('DELETE FROM outbox');
        await db.runAsync('DELETE FROM stats_cache');
        await db.runAsync('DELETE FROM streak_cache');
        await db.runAsync('DELETE FROM habit_streak_cache');
        await db.runAsync('DELETE FROM habit_schedule');
        await db.runAsync('DELETE FROM user_profile');

        const profile = { ...data.profile, photo_uri: mapUri(remap, data.profile.photo_uri) };
        await db.runAsync(
          `INSERT INTO user_profile (id, display_name, avatar_seed, locale, theme_mode, created_at, photo_uri)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          profile.id,
          profile.display_name,
          profile.avatar_seed,
          profile.locale,
          profile.theme_mode,
          profile.created_at,
          profile.photo_uri,
        );

        for (const h of data.habits) {
          await db.runAsync(
            `INSERT INTO habit (id, name, icon, category, color_token, frequency, custom_days, target_value,
              unit, reminder_time, sort_order, is_archived, created_at, updated_at, sync_status, time_slot)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            h.id, h.name, h.icon, h.category, h.color_token, h.frequency, h.custom_days,
            h.target_value, h.unit, h.reminder_time, h.sort_order, h.is_archived,
            h.created_at, h.updated_at, h.sync_status, h.time_slot,
          );
        }
        for (const l of data.habitLogs) {
          await db.runAsync(
            `INSERT INTO habit_log (id, habit_id, log_date, completed, value, completed_at, created_at, updated_at, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            l.id, l.habit_id, l.log_date, l.completed, l.value, l.completed_at,
            l.created_at, l.updated_at, l.sync_status,
          );
        }
        for (const g of data.goals) {
          await db.runAsync(
            `INSERT INTO goal (id, title, description, category, target_value, current_value, unit, deadline,
              status, created_at, updated_at, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            g.id, g.title, g.description, g.category, g.target_value, g.current_value, g.unit,
            g.deadline, g.status, g.created_at, g.updated_at, g.sync_status,
          );
        }
        for (const u of data.goalUpdates) {
          await db.runAsync(
            `INSERT INTO goal_update (id, goal_id, delta, note, entry_date, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            u.id, u.goal_id, u.delta, u.note, u.entry_date, u.created_at,
          );
        }
        for (const w of data.wellEntries) {
          await db.runAsync(
            `INSERT INTO well_entry (id, entry_date, mood, energy, note, created_at, updated_at, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            w.id, w.entry_date, w.mood, w.energy, w.note, w.created_at, w.updated_at, w.sync_status,
          );
        }
        for (const a of data.achievements) {
          await db.runAsync(
            `INSERT OR REPLACE INTO achievement (id, key, title, description, icon, criteria, is_custom, progress_style, unlock_mode)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            a.id, a.key, a.title, a.description, a.icon, a.criteria, a.is_custom,
            a.progress_style, a.unlock_mode,
          );
        }
        for (const m of data.milestones) {
          await db.runAsync(
            `INSERT INTO milestone (id, user_id, title, note, occurred_at, created_at, sync_state) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            m.id, m.user_id, m.title, m.note, m.occurred_at, m.created_at, m.sync_state,
          );
        }
        for (const mi of data.milestoneImages) {
          await db.runAsync(
            `INSERT INTO milestone_image (id, milestone_id, uri, position) VALUES (?, ?, ?, ?)`,
            mi.id, mi.milestone_id, mapUri(remap, mi.uri), mi.position,
          );
        }
        for (const ml of data.milestoneLinks) {
          await db.runAsync(
            `INSERT OR IGNORE INTO milestone_link (milestone_id, entity_type, entity_id) VALUES (?, ?, ?)`,
            ml.milestone_id, ml.entity_type, ml.entity_id,
          );
        }
        for (const mo of data.motivations) {
          await db.runAsync(
            `INSERT INTO motivation (id, user_id, text, emoji, goal_id, trigger_type, active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            mo.id, mo.user_id, mo.text, mo.emoji, mo.goal_id, mo.trigger_type, mo.active, mo.created_at,
          );
        }
        for (const ms of data.motivationShows) {
          await db.runAsync(
            `INSERT OR IGNORE INTO motivation_show (motivation_id, shown_on) VALUES (?, ?)`,
            ms.motivation_id, ms.shown_on,
          );
        }
        for (const f of data.streakFreezes) {
          await db.runAsync(
            `INSERT INTO streak_freeze (id, user_id, used_date) VALUES (?, ?, ?)`,
            f.id, f.user_id, f.used_date,
          );
        }
        // Desbloqueos: sólo sobre medallas existentes (seeds pueden cambiar entre versiones).
        for (const un of data.achievementUnlocks) {
          await db.runAsync(
            `INSERT OR IGNORE INTO achievement_unlock (id, user_id, achievement_id, unlocked_at)
             SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM achievement WHERE id = ?)`,
            un.id, un.user_id, un.achievement_id, un.unlocked_at, un.achievement_id,
          );
        }

        // Derivadas: se recalculan en el próximo toggle/recompute.
        await db.runAsync(
          `INSERT INTO streak_cache (user_id, global_current_streak, global_best_streak, recomputed_at)
           VALUES (?, 0, 0, datetime('now'))`,
          profile.id,
        );
      });
    } catch (e) {
      // Rollback de fotos si la transacción falló (evita huérfanos en FS).
      for (const uri of written) {
        try {
          const f = new File(uri);
          if (f.exists) f.delete();
        } catch {
          // limpieza best-effort
        }
      }
      if (e instanceof AppError) throw e;
      throw new AppError(
        ERROR_CODES.BACKUP_CORRUPT,
        e instanceof Error ? e.message : 'No se pudo restaurar el backup',
      );
    }
  },
};
