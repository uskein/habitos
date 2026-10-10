/** Entidades ACHIEVEMENT / ACHIEVEMENT_UNLOCK — MODELO_DE_DATOS §2.7 */

export interface AchievementCriteria {
  type: 'habit_created' | 'habit_completed' | 'streak_reached' | 'goal_completed' | 'checkin_count';
  threshold: number;
  scope?: string;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  criteria: AchievementCriteria;
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
