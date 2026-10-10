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
  /** Sync diferida (Fase 2) */
  SYNC_MAX_OPS_PER_BATCH: 500,
} as const;

/** Fecha local YYYY-MM-DD sin UTC drift. */
export function localDateISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
