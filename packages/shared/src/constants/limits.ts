/** Límites de negocio compartidos — trazables a REQUERIMIENTOS_FUNCIONALES.md */
export const LIMITS = {
  /** HU-1: nombre de perfil */
  PROFILE_NAME_MAX: 40,
  /** HU-4: nombre de hábito (CONTRATOS_API §2.1) */
  HABIT_NAME_MAX: 60,
  HABIT_ICON_MAX: 8,
  HABIT_UNIT_MAX: 12,
  /** HU-2: PIN y backoff */
  PIN_LENGTH: 6,
  PIN_MAX_ATTEMPTS: 5,
  PIN_BACKOFF_BASE_MS: 30_000,
  /** HU-11: check-in 1–5 */
  MOOD_MIN: 1,
  MOOD_MAX: 5,
  ENERGY_MIN: 1,
  ENERGY_MAX: 5,
  /** V2 — hitos (HU-17/HU-18) */
  MILESTONE_TITLE_MAX: 80,
  MILESTONE_NOTE_MAX: 500,
  MILESTONE_IMAGES_MAX: 10,
  MILESTONE_LINKS_MAX: 20,
  /** V2 — motivaciones (HU-24) */
  MOTIVATION_TEXT_MAX: 140,
  MOTIVATION_MAX_PER_USER: 50,
  /** V2 — medallas custom (HU-21) */
  ACHIEVEMENT_THRESHOLD_MIN: 1,
  /** V2.1 — racha con freeze (HU-27) */
  FREEZE_MONTHLY_QUOTA: 2,
  /** V2.1 — fotos (HU-14/HU-17) */
  PHOTO_AVATAR_MAX_BYTES: 250 * 1024,
  PHOTO_MILESTONE_MAX_BYTES: 2 * 1024 * 1024,
  /** Sync diferida (Fase 2) */
  SYNC_MAX_OPS_PER_BATCH: 500,
} as const;

/** V2 — tramos horarios de hábito (HU-30). */
export const TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

/** V2.1 · HU-30 — rango de horas de cada tramo (evening con wrap 20→4). */
export const TIME_SLOT_HOURS: Record<TimeSlot, { from: number; to: number }> = {
  morning: { from: 5, to: 11 },
  afternoon: { from: 12, to: 19 },
  evening: { from: 20, to: 4 }, // wrap: ≥20 o ≤4
};

/** ¿`hour` (0–23) cae dentro del tramo? */
export function hourInSlot(hour: number, slot: TimeSlot): boolean {
  const { from, to } = TIME_SLOT_HOURS[slot];
  if (from <= to) return hour >= from && hour <= to;
  return hour >= from || hour <= to;
}

/** Fecha local YYYY-MM-DD sin UTC drift. */
export function localDateISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
