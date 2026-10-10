/**
 * levelService — evaluación PURA de criterios de logros (HU-13).
 * Nunca toca la base: recibe estado y decide qué keys desbloquear.
 */

import type { AchievementEvent } from '@habitos/shared';
import type { Achievement, AchievementUnlock, AchievementCriteria } from '../entities/achievement';

export interface EvaluationStats {
  /** Nº de hábitos activos creados */
  habitCount: number;
  /** Fechas completadas globales (sin duplicados) */
  globalCompletedDates: string[];
  /** Mejor racha global histórica */
  bestGlobalStreak: number;
  checkinCount: number;
  goalsCompleted: number;
  /** V2 — fechas cumplidas por hábito (para criterios habit_ids). */
  habitDates?: Record<string, string[]>;
  /** V2 — estado por meta (para criterios goal_ids). */
  goalStates?: Record<string, { current: number; target: number }>;
}

/** V2 · HU-22 — días cumplidos del conjunto según mode (any = unión, all = intersección). */
function countDays(datesByHabit: Record<string, string[]>, ids: string[], mode: 'any' | 'all'): number {
  const sets = ids
    .map((id) => datesByHabit[id])
    .filter((d): d is string[] => Array.isArray(d))
    .map((d) => new Set(d));
  if (sets.length === 0) return 0;
  if (mode === 'any') {
    const union = new Set<string>();
    for (const s of sets) for (const d of s) union.add(d);
    return union.size;
  }
  let smallest = sets[0] ?? new Set<string>();
  for (const s of sets) if (s.size < smallest.size) smallest = s;
  let count = 0;
  for (const d of smallest) if (sets.every((s) => s.has(d))) count++;
  return count;
}

function completedGoals(states: Record<string, { current: number; target: number }>, ids: string[]): number {
  return ids.filter((id) => {
    const s = states[id];
    return s && s.current >= s.target;
  }).length;
}

/** Progreso 0..threshold para criterios custom (barra de la medalla). */
export function customProgress(c: AchievementCriteria, stats: EvaluationStats): number {
  const dates = stats.habitDates ?? {};
  const goals = stats.goalStates ?? {};
  const habitDays = countDays(dates, c.habitIds ?? [], c.mode ?? 'any');
  const goalCount = completedGoals(goals, c.goalIds ?? []);
  if (c.type === 'habit_count') return Math.min(c.threshold, habitDays);
  if (c.type === 'goal_complete') return Math.min(c.threshold, goalCount);
  return Math.min(c.threshold, Math.min(habitDays, goalCount));
}

function matchesCustom(c: AchievementCriteria, stats: EvaluationStats): boolean {
  const dates = stats.habitDates ?? {};
  const goals = stats.goalStates ?? {};
  const habitDays = countDays(dates, c.habitIds ?? [], c.mode ?? 'any');
  const goalCount = completedGoals(goals, c.goalIds ?? []);
  const hasGoals = (c.goalIds?.length ?? 0) > 0;

  switch (c.type) {
    case 'habit_count':
      return habitDays >= c.threshold;
    case 'goal_complete':
      return goalCount >= c.threshold;
    case 'combined': {
      const habitsOk = habitDays >= c.threshold;
      const goalsOk =
        c.mode === 'any'
          ? goalCount >= 1
          : goalCount >= (c.goalIds?.length ?? 0);
      void hasGoals;
      return habitsOk && goalsOk;
    }
    default:
      return false;
  }
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
    .filter((a) => (isCustom(a) ? matchesCustom(a.criteria, stats) : matches(a, event, stats, today)))
    .map((a) => a.key);
}

function isCustom(a: Achievement): boolean {
  return a.isCustom === true || ['habit_count', 'goal_complete', 'combined'].includes(a.criteria.type);
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
