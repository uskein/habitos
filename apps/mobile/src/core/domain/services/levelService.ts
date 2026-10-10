/**
 * levelService — evaluación PURA de criterios de logros (HU-13).
 * Nunca toca la base: recibe estado y decide qué keys desbloquear.
 */

import type { AchievementEvent } from '@habitos/shared';
import type { Achievement, AchievementUnlock } from '../entities/achievement';

export interface EvaluationStats {
  /** Nº de hábitos activos creados */
  habitCount: number;
  /** Fechas completadas globales (sin duplicados) */
  globalCompletedDates: string[];
  /** Mejor racha global histórica */
  bestGlobalStreak: number;
  checkinCount: number;
  goalsCompleted: number;
}

/** Evalúa un evento contra el catálogo. Devuelve keys aún no desbloqueadas que cumplen. */
export function evaluateEvent(
  catalog: Achievement[],
  unlocks: AchievementUnlock[],
  event: AchievementEvent,
  stats: EvaluationStats,
  today: string,
): string[] {
  const unlockedIds = new Set(unlocks.map((u) => u.achievementId));

  return catalog
    .filter((a) => !unlockedIds.has(a.id))
    .filter((a) => matches(a, event, stats, today))
    .map((a) => a.key);
}

function matches(
  a: Achievement,
  event: AchievementEvent,
  stats: EvaluationStats,
  _today: string,
): boolean {
  const c = a.criteria;
  switch (c.type) {
    case 'habit_created':
      return event.type === 'habit_created' && stats.habitCount >= c.threshold;
    case 'habit_completed':
      return event.type === 'habit_completed' && stats.globalCompletedDates.length >= c.threshold;
    case 'streak_reached':
      return (
        (event.type === 'streak_reached' ||
          event.type === 'habit_completed' ||
          event.type === 'goal_completed') &&
        stats.bestGlobalStreak >= c.threshold
      );
    case 'goal_completed':
      return event.type === 'goal_completed' && stats.goalsCompleted >= c.threshold;
    case 'checkin_count':
      return event.type === 'checkin_created' && stats.checkinCount >= c.threshold;
    default:
      return false;
  }
}
