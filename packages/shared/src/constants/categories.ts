/** Enumeraciones canónicas — MODELO_DE_DATOS.md + REQUERIMIENTOS_FUNCIONALES.md */

export const HABIT_CATEGORIES = ['bienestar', 'meta', 'habito'] as const;
export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

export const HABIT_COLOR_TOKENS = [
  'primary-soft',
  'success-soft',
  'warning-soft',
  'accent-soft',
] as const;
export type HabitColorToken = (typeof HABIT_COLOR_TOKENS)[number];

export const HABIT_FREQUENCIES = ['daily', 'custom'] as const;
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

export const GOAL_STATUSES = ['active', 'completed', 'abandoned'] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

/** Eventos que dispara AchievementRepository.evaluateAndUnlock (HU-13) */
export type AchievementEvent =
  | { type: 'habit_created'; habitId: string }
  | { type: 'habit_completed'; habitId: string; date: string }
  | { type: 'streak_reached'; days: number }
  | { type: 'goal_completed'; goalId: string }
  | { type: 'checkin_created'; date: string };
