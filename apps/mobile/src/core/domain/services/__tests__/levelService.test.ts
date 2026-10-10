import type { Achievement, AchievementUnlock } from '../../entities/achievement';
import { evaluateEvent, type EvaluationStats } from '../levelService';

function makeAchievement(
  id: string,
  type: Achievement['criteria']['type'],
  threshold: number,
): Achievement {
  return {
    id,
    key: id,
    title: id,
    description: id,
    icon: '🏅',
    criteria: { type, threshold },
  };
}

const baseStats: EvaluationStats = {
  habitCount: 0,
  globalCompletedDates: [],
  bestGlobalStreak: 0,
  checkinCount: 0,
  goalsCompleted: 0,
};

describe('evaluateEvent (HU-13, idempotente)', () => {
  const catalog = [makeAchievement('a1', 'habit_created', 3)];
  const today = '2026-10-10';

  test('no desbloquea si no se cumple el umbral', () => {
    const keys = evaluateEvent(catalog, [], { type: 'habit_created', habitId: 'h' }, {
      ...baseStats,
      habitCount: 2,
    }, today);
    expect(keys).toEqual([]);
  });

  test('desbloquea al cumplir el umbral', () => {
    const keys = evaluateEvent(catalog, [], { type: 'habit_created', habitId: 'h' }, {
      ...baseStats,
      habitCount: 3,
    }, today);
    expect(keys).toEqual(['a1']);
  });

  test('no re-desbloquea una medalla ya obtenida', () => {
    const unlocks: AchievementUnlock[] = [
      { id: 'u1', userId: 'me', achievementId: 'a1', unlockedAt: '2026-10-01' },
    ];
    const keys = evaluateEvent(catalog, unlocks, { type: 'habit_created', habitId: 'h' }, {
      ...baseStats,
      habitCount: 10,
    }, today);
    expect(keys).toEqual([]);
  });

  test('streak_reached evalúa también con evento habit_completed', () => {
    const cat = [makeAchievement('s1', 'streak_reached', 7)];
    const keys = evaluateEvent(cat, [], { type: 'habit_completed', habitId: 'h', date: today }, {
      ...baseStats,
      bestGlobalStreak: 7,
    }, today);
    expect(keys).toEqual(['s1']);
  });
});
