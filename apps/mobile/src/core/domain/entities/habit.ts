/** Entidades HABIT / HABIT_LOG / HABIT_STREAK_CACHE — MODELO_DE_DATOS §2.2–2.4 */

export type HabitCategory = 'bienestar' | 'meta' | 'habito';
export type HabitFrequency = 'daily' | 'custom';
export type SyncStatus = 'pending' | 'synced' | 'deleted';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: HabitCategory;
  colorToken: string;
  frequency: HabitFrequency;
  customDays: number[] | null;
  targetValue: number | null;
  unit: string | null;
  reminderTime: string | null;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface HabitLog {
  id: string;
  habitId: string;
  logDate: string;
  completed: boolean;
  value: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

/** Feed "hoy": hábito + log de la fecha consultada */
export interface HabitWithLog extends Habit {
  log: HabitLog | null;
}

export interface HabitStreakCache {
  habitId: string;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
  recomputedAt: string;
}
