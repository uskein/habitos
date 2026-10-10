/** Entidades ACHIEVEMENT / ACHIEVEMENT_UNLOCK — MODELO_DE_DATOS §2.7 · §2.10 (V2) */

export type AchievementCriteriaType =
  | 'habit_created'
  | 'habit_completed'
  | 'streak_reached'
  | 'goal_completed'
  | 'checkin_count'
  /** V2 custom */
  | 'habit_count'
  | 'goal_complete'
  | 'combined';

export interface AchievementCriteria {
  type: AchievementCriteriaType;
  threshold: number;
  scope?: string;
  /** V2 · HU-22 — vínculos y modo de combinación. */
  habitIds?: string[];
  goalIds?: string[];
  mode?: 'any' | 'all';
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  criteria: AchievementCriteria;
  /** V2 §2.10 — semillas jamás editables (is_custom = 0). */
  isCustom?: boolean;
  progressStyle?: 'bar' | 'level' | 'hidden';
  unlockMode?: 'auto' | 'review';
}

export interface AchievementUnlock {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

/** STREAK_CACHE global — MODELO_DE_DATOS §2.4 */
export interface GlobalStreakCache {
  userId: string;
  globalCurrentStreak: number;
  globalBestStreak: number;
  recomputedAt: string;
}
