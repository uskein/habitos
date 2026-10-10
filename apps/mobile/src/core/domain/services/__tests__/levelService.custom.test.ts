import { evaluateEvent, customProgress, type EvaluationStats } from '../levelService';
import type { Achievement, AchievementCriteria, AchievementUnlock } from '../../entities/achievement';

const baseStats = (over: Partial<EvaluationStats> = {}): EvaluationStats => ({
  habitCount: 1,
  globalCompletedDates: [],
  bestGlobalStreak: 0,
  checkinCount: 0,
  goalsCompleted: 0,
  habitDates: {},
  goalStates: {},
  ...over,
});

const custom = (criteria: AchievementCriteria, id = 'a1'): Achievement => ({
  id,
  key: `k_${id}`,
  title: 'Custom',
  description: '',
  icon: '🏅',
  criteria,
  isCustom: true,
});

const event = { type: 'habit_completed', habitId: 'h1', date: '2026-10-08' } as const;
const stats = baseStats();

describe('evaluateEvent — criterios custom V2 (HU-21/22/23)', () => {
  const catalog = [
    custom({ type: 'habit_count', threshold: 7, habitIds: ['h1'], mode: 'any' }),
    custom({ type: 'combined', threshold: 7, habitIds: ['h1'], goalIds: ['g1'], mode: 'all' }, 'a2'),
  ];

  it('habit_count: desbloquea al alcanzar el umbral de días', () => {
    const s = baseStats({ habitDates: { h1: ['2026-10-01', '2026-10-02', '2026-10-03'] } });
    expect(evaluateEvent([catalog[0]!], [], event, s, '2026-10-04')).toHaveLength(0);

    const ok = baseStats({
      habitDates: { h1: Array.from({ length: 7 }, (_, i) => `2026-10-0${i + 1}`) },
    });
    expect(evaluateEvent([catalog[0]!], [], event, ok, '2026-10-08')).toEqual(['k_a1']);
  });

  it('idempotente: ya desbloqueada → nunca vuelve a salir (UNIQUE)', () => {
    const ok = baseStats({
      habitDates: { h1: Array.from({ length: 7 }, (_, i) => `2026-10-0${i + 1}`) },
    });
    const unlocks: AchievementUnlock[] = [
      { id: 'u1', userId: 'u', achievementId: 'a1', unlockedAt: '' },
    ];
    expect(evaluateEvent([catalog[0]!], unlocks, event, ok, '2026-10-08')).toHaveLength(0);
    expect(evaluateEvent([catalog[0]!], unlocks, event, ok, '2026-10-08')).toHaveLength(0);
  });

  it('mode all (intersección): solo los días compartidos cuentan', () => {
    const s = baseStats({
      habitDates: { h1: ['2026-10-01', '2026-10-02', '2026-10-03'] },
      goalStates: { g1: { current: 12, target: 12 } },
    });
    const keys = evaluateEvent([catalog[1]!], [], event, s, '2026-10-04');
    expect(keys).toHaveLength(0); // 3 días < umbral 7
  });

  it('combined: exige hábitos y metas', () => {
    const days = Array.from({ length: 7 }, (_, i) => `2026-10-0${i + 1}`);
    const both = baseStats({ habitDates: { h1: days }, goalStates: { g1: { current: 12, target: 12 } } });
    expect(evaluateEvent([catalog[1]!], [], event, both, '2026-10-08')).toEqual(['k_a2']);

    const noGoal = baseStats({ habitDates: { h1: days }, goalStates: { g1: { current: 5, target: 12 } } });
    expect(evaluateEvent([catalog[1]!], [], event, noGoal, '2026-10-08')).toHaveLength(0);
  });

  it('customProgress sirve progreso para la barra de la medalla', () => {
    const c: AchievementCriteria = { type: 'habit_count', threshold: 7, habitIds: ['h1'], mode: 'any' };
    const s = baseStats({ habitDates: { h1: ['d1', 'd2', 'd3'] } });
    expect(customProgress(c, s)).toBe(3);
    expect(customProgress(c, baseStats({ habitDates: { h1: Array.from({ length: 9 }, (_, i) => `d${i}`) } }))).toBe(7);
  });
});
