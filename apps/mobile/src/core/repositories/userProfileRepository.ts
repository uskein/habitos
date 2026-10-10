import { AppError, ERROR_CODES, LIMITS } from '@habitos/shared';
import { randomUUID } from 'expo-crypto';
import { getDb } from '../data/database';
import type { UserProfile } from '../domain/entities/userProfile';

interface ProfileRow {
  id: string;
  display_name: string;
  avatar_seed: number;
  locale: string;
  theme_mode: string;
  created_at: string;
  photo_uri: string | null;
}

function toProfile(r: ProfileRow): UserProfile {
  return {
    id: r.id,
    displayName: r.display_name,
    avatarSeed: r.avatar_seed,
    locale: r.locale,
    themeMode: r.theme_mode as UserProfile['themeMode'],
    createdAt: r.created_at,
    photoUri: r.photo_uri,
  };
}

export const userProfileRepository = {
  async get(): Promise<UserProfile | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<ProfileRow>(
      `SELECT id, display_name, avatar_seed, locale, theme_mode, created_at, photo_uri
       FROM user_profile LIMIT 1`,
    );
    return row ? toProfile(row) : null;
  },

  /** HU-1: inserta perfil con avatar_seed aleatorio. */
  async create(displayName: string): Promise<UserProfile> {
    const name = displayName.trim();
    if (name.length < 1 || name.length > LIMITS.PROFILE_NAME_MAX) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `El nombre debe tener 1–${LIMITS.PROFILE_NAME_MAX} caracteres`,
      );
    }
    const db = await getDb();
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_profile LIMIT 1');
    if (existing) throw new AppError(ERROR_CODES.CONFLICT, 'Ya existe un perfil local');

    const id = randomUUID();
    const avatarSeed = Math.floor(Math.random() * 10000);
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'INSERT INTO user_profile (id, display_name, avatar_seed) VALUES (?, ?, ?)',
        id,
        name,
        avatarSeed,
      );
      await db.runAsync(
        'INSERT INTO streak_cache (user_id) VALUES (?) ON CONFLICT DO NOTHING',
        id,
      );
    });
    const created = await this.get();
    if (!created) throw new AppError(ERROR_CODES.INTERNAL, 'Perfil no creado');
    return created;
  },

  /** Edición de identidad desde Perfil (HU-1). */
  async updateName(displayName: string): Promise<UserProfile> {
    const name = displayName.trim();
    if (name.length < 1 || name.length > LIMITS.PROFILE_NAME_MAX) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `El nombre debe tener 1–${LIMITS.PROFILE_NAME_MAX} caracteres`,
      );
    }
    const db = await getDb();
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_profile LIMIT 1');
    if (!existing) throw new AppError(ERROR_CODES.NOT_FOUND, 'No hay perfil local');

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'UPDATE user_profile SET display_name = ? WHERE id = ?',
        name,
        existing.id,
      );
      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload) VALUES (?, 'user_profile', ?, 'update', ?)`,
        randomUUID(),
        existing.id,
        JSON.stringify({ displayName: name }),
      );
    });
    const updated = await this.get();
    if (!updated) throw new AppError(ERROR_CODES.INTERNAL, 'Perfil no actualizado');
    return updated;
  },

  /** V2 · HU-14 — guarda la ruta de la foto (el binario ya está en imageStore). */
  async setPhoto(photoUri: string): Promise<UserProfile> {
    if (!photoUri.startsWith('file:')) {
      throw new AppError(ERROR_CODES.IMAGE_INVALID_TYPE, 'Ruta de foto no válida');
    }
    const db = await getDb();
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_profile LIMIT 1');
    if (!existing) throw new AppError(ERROR_CODES.NOT_FOUND, 'No hay perfil local');
    await db.runAsync('UPDATE user_profile SET photo_uri = ? WHERE id = ?', photoUri, existing.id);
    const updated = await this.get();
    if (!updated) throw new AppError(ERROR_CODES.INTERNAL, 'Foto no guardada');
    return updated;
  },

  /** V2 · HU-14 — quitar foto (borrado del archivo lo hace el caller). */
  async clearPhoto(): Promise<UserProfile> {
    const db = await getDb();
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_profile LIMIT 1');
    if (!existing) throw new AppError(ERROR_CODES.NOT_FOUND, 'No hay perfil local');
    await db.runAsync('UPDATE user_profile SET photo_uri = NULL WHERE id = ?', existing.id);
    const updated = await this.get();
    if (!updated) throw new AppError(ERROR_CODES.INTERNAL, 'Foto no quitada');
    return updated;
  },
};
