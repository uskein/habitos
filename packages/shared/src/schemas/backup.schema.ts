import { z } from 'zod';
import { HABIT_CATEGORIES, HABIT_COLOR_TOKENS, HABIT_FREQUENCIES } from '../constants/categories';

/**
 * HU-28 · V2 — esquema del backup cifrado.
 * Validación Zod COMPLETA previa al import (rollback total si algo falla).
 * Filas tal y como salen de SQLite (snake_case, tipos crudos).
 */

export const BACKUP_VERSION = 1;
export const BACKUP_MAGIC = 'HABITOSBK1';

const isoLike = z.string().min(8).max(40);
const text = z.string();
const nulText = z.string().nullable();
const nulNum = z.number().nullable();

const profileRow = z
  .object({
    id: text,
    display_name: text.max(40),
    avatar_seed: z.number().int(),
    locale: text,
    theme_mode: z.enum(['light', 'dark', 'system']),
    created_at: isoLike,
    photo_uri: nulText,
  })
  .strict();

const habitRow = z
  .object({
    id: text,
    name: text.min(1).max(60),
    icon: text,
    category: z.enum(HABIT_CATEGORIES),
    color_token: z.enum(HABIT_COLOR_TOKENS),
    frequency: z.enum(HABIT_FREQUENCIES),
    custom_days: nulText,
    target_value: z.number().int().nullable(),
    unit: nulText,
    reminder_time: nulText,
    sort_order: z.number().int(),
    is_archived: z.number().int().min(0).max(1),
    created_at: isoLike,
    updated_at: isoLike,
    sync_status: z.enum(['pending', 'synced', 'deleted']),
    time_slot: z.enum(['morning', 'afternoon', 'evening']).nullable(),
  })
  .strict();

const habitLogRow = z
  .object({
    id: text,
    habit_id: text,
    log_date: isoLike,
    completed: z.number().int().min(0).max(1),
    value: z.number().nullable(),
    completed_at: nulText,
    created_at: isoLike,
    updated_at: isoLike,
    sync_status: z.enum(['pending', 'synced', 'deleted']),
  })
  .strict();

const goalRow = z
  .object({
    id: text,
    title: text.max(80),
    description: nulText,
    category: nulText,
    target_value: z.number().positive(),
    current_value: z.number().min(0),
    unit: nulText,
    deadline: nulText,
    status: z.enum(['active', 'completed', 'abandoned']),
    created_at: isoLike,
    updated_at: isoLike,
    sync_status: z.enum(['pending', 'synced', 'deleted']),
  })
  .strict();

const goalUpdateRow = z
  .object({
    id: text,
    goal_id: text,
    delta: z.number().refine((v) => v !== 0, { message: 'delta != 0' }),
    note: nulText,
    entry_date: isoLike,
    created_at: isoLike,
  })
  .strict();

const wellEntryRow = z
  .object({
    id: text,
    entry_date: isoLike,
    mood: z.number().int().min(1).max(5),
    energy: z.number().int().min(1).max(5),
    note: nulText,
    created_at: isoLike,
    updated_at: isoLike,
    sync_status: z.enum(['pending', 'synced', 'deleted']),
  })
  .strict();

const achievementRow = z
  .object({
    id: text,
    key: text,
    title: text,
    description: text,
    icon: text,
    criteria: text,
    is_custom: z.number().int().min(0).max(1),
    progress_style: z.enum(['bar', 'level', 'hidden']),
    unlock_mode: z.enum(['auto', 'review']),
  })
  .strict();

const achievementUnlockRow = z
  .object({
    id: text,
    user_id: text,
    achievement_id: text,
    unlocked_at: isoLike,
  })
  .strict();

const milestoneRow = z
  .object({
    id: text,
    user_id: text,
    title: text.min(1).max(80),
    note: nulText,
    occurred_at: isoLike,
    created_at: isoLike,
    sync_state: z.enum(['pending', 'synced']),
  })
  .strict();

const milestoneImageRow = z
  .object({
    id: text,
    milestone_id: text,
    uri: text,
    position: z.number().int().min(0),
  })
  .strict();

const milestoneLinkRow = z
  .object({
    milestone_id: text,
    entity_type: z.enum(['habit', 'goal']),
    entity_id: text,
  })
  .strict();

const motivationRow = z
  .object({
    id: text,
    user_id: text,
    text: text.max(140),
    emoji: text,
    goal_id: nulText,
    trigger_type: z.enum(['no_streak', 'morning', 'missed_day']),
    active: z.number().int().min(0).max(1),
    created_at: isoLike,
  })
  .strict();

const motivationShowRow = z
  .object({
    motivation_id: text,
    shown_on: isoLike,
  })
  .strict();

const streakFreezeRow = z
  .object({
    id: text,
    user_id: text,
    used_date: isoLike,
  })
  .strict();

/** Foto en base64 con su ruta de origen (mapeada a ruta nueva al importar). */
export const backupPhoto = z
  .object({
    uri: text,
    data: text.min(1),
  })
  .strict();

export const BackupPayload = z
  .object({
    version: z.literal(BACKUP_VERSION),
    exportedAt: isoLike,
    profile: profileRow,
    habits: z.array(habitRow),
    habitLogs: z.array(habitLogRow),
    goals: z.array(goalRow),
    goalUpdates: z.array(goalUpdateRow),
    wellEntries: z.array(wellEntryRow),
    achievements: z.array(achievementRow),
    achievementUnlocks: z.array(achievementUnlockRow),
    milestones: z.array(milestoneRow),
    milestoneImages: z.array(milestoneImageRow),
    milestoneLinks: z.array(milestoneLinkRow),
    motivations: z.array(motivationRow),
    motivationShows: z.array(motivationShowRow),
    streakFreezes: z.array(streakFreezeRow),
    photos: z.array(backupPhoto),
  })
  .strict();

export type BackupPayloadType = z.infer<typeof BackupPayload>;
export type BackupPhotoType = z.infer<typeof backupPhoto>;
