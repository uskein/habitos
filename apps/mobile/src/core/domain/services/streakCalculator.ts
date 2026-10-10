/**
 * streakCalculator — servicio PURO (sin I/O, sin React).
 * Fuente de verdad: habit_logs; los caches se recalculan desde aquí (ADR-006).
 */

const DAY_MS = 86_400_000;

function parseDate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!);
}

/** Diferencia en días (b - a), timezone-free sobre fechas locales YYYY-MM-DD. */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b) - parseDate(a)) / DAY_MS);
}

export function addDays(iso: string, n: number): string {
  const t = parseDate(iso) + n * DAY_MS;
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
}

/**
 * Calcula racha actual y récord desde las fechas completadas (YYYY-MM-DD).
 * Racha = días consecutivos terminando hoy o ayer (hoy pendiente aún no rompe).
 *
 * V2.1 · HU-27 — `freezesAvailable` (default 0 = V1 intacto): nº de freezes que
 * pueden tapar huecos; se consumen en orden (hueco final primero, luego internos).
 * bestStreak es histórico: los freezes no lo alteran.
 */
export function computeStreak(
  completedDates: string[],
  today: string,
  freezesAvailable = 0,
): StreakResult {
  if (completedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0, lastCompletedDate: null };
  }

  const sorted = [...new Set(completedDates)].sort();
  const last = sorted[sorted.length - 1]!;

  const gapFromToday = daysBetween(last, today);
  let remaining = freezesAvailable;
  let alive = gapFromToday <= 1;
  let frozenTail = 0; // días perdidos (hoy..último log) protegidos por freeze
  if (!alive) {
    const missing = gapFromToday - 1; // hoy pendiente no cuenta
    if (missing <= remaining) {
      alive = true;
      remaining -= missing;
      frozenTail = missing;
    }
  }

  let currentStreak = 0;
  if (alive) {
    currentStreak = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      const prev = sorted[i - 1]!;
      const gap = daysBetween(prev, sorted[i]!);
      if (gap === 1) {
        currentStreak++;
      } else if (gap - 1 <= remaining) {
        // hueco intertapado por freeze
        remaining -= gap - 1;
        currentStreak += gap;
      } else {
        break;
      }
    }
    currentStreak += frozenTail;
  }

  let bestStreak = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (daysBetween(sorted[i - 1]!, sorted[i]!) === 1) {
      run++;
      if (run > bestStreak) bestStreak = run;
    } else {
      run = 1;
    }
  }

  return { currentStreak, bestStreak, lastCompletedDate: last };
}

/**
 * Racha global: días en que AL MENOS un hábito se completó, consecutivos hasta hoy/ayer.
 */
export function computeGlobalStreak(
  allCompletedDates: string[],
  today: string,
  freezesAvailable = 0,
): StreakResult {
  return computeStreak(allCompletedDates, today, freezesAvailable);
}
