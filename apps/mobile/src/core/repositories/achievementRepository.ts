import type { AchievementEvent } from '@habitos/shared';
import { randomUUID } from 'expo-crypto';
import { getDb } from '../data/database';
import { rowToAchievement, seedAchievements } from '../data/seeds/achievements';
import type { Achievement, AchievementUnlock } from '../domain/entities/achievement';
import type { AchievementRepository } from '../domain/repositoryInterfaces';
import { evaluateAchievementEvent } from './achievementEvaluation';

export const achievementRepository: AchievementRepository = {
  async listCatalog() {
    const db = await getDb();
    await seedAchievements(db);
    const rows = await db.getAllAsync<{
      id: string;
      key: string;
      title: string;
      description: string;
      icon: string;
      criteria: string;
    }>('SELECT id, key, title, description, icon, criteria FROM achievement ORDER BY key');
    return rows.map(rowToAchievement);
  },

  async listUnlocked() {
    const db = await getDb();
    const profile = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_profile LIMIT 1');
    if (!profile) return [];
    const rows = await db.getAllAsync<{
      id: string;
      achievement_id: string;
      unlocked_at: string;
    }>('SELECT id, achievement_id, unlocked_at FROM achievement_unlock WHERE user_id = ?', profile.id);
    return rows.map(
      (r): AchievementUnlock => ({
        id: r.id,
        userId: profile.id,
        achievementId: r.achievement_id,
        unlockedAt: r.unlocked_at,
      }),
    );
  },

  async evaluateAndUnlock(event: AchievementEvent) {
    const db = await getDb();
    const before = await this.listUnlocked();
    await evaluateAchievementEvent(db, event);
    const after = await this.listUnlocked();
    const fresh = after.find((u) => !before.some((b) => b.id === u.id));
    if (!fresh) return null;
    return fresh;
  },
};

export { randomUUID };
