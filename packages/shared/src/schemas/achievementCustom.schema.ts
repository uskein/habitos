import { z } from 'zod';
import { LIMITS } from '../constants/limits';

export const ACHIEVEMENT_PROGRESS_STYLES = ['bar', 'level', 'hidden'] as const;
export const ACHIEVEMENT_UNLOCK_MODES = ['auto', 'review'] as const;

/** V2 · HU-21/HU-22 — medalla personalizada con criterio y vínculos. */
export const CustomAchievementCriteria = z
  .object({
    type: z.enum(['habit_count', 'goal_complete', 'combined']),
    threshold: z.number().int().min(LIMITS.ACHIEVEMENT_THRESHOLD_MIN),
    habitIds: z.array(z.string().uuid()).optional(),
    goalIds: z.array(z.string().uuid()).min(1).optional(),
    mode: z.enum(['any', 'all']).default('any'),
  })
  .strict();

export const CreateCustomAchievementInput = z
  .object({
    title: z.string().trim().min(1).max(40),
    description: z.string().trim().max(80).optional(),
    icon: z.string().trim().max(8).default('🏅'),
    criteria: CustomAchievementCriteria,
    progressStyle: z.enum(ACHIEVEMENT_PROGRESS_STYLES).default('bar'),
    unlockMode: z.enum(ACHIEVEMENT_UNLOCK_MODES).default('auto'),
  })
  .strict()
  .refine((v) => (v.criteria.habitIds?.length ?? 0) + (v.criteria.goalIds?.length ?? 0) >= 1, {
    message: 'La medalla requiere al menos 1 vínculo (hábito o meta)',
    path: ['criteria'],
  })
  .refine((v) => v.criteria.type === 'goal_complete' || (v.criteria.habitIds?.length ?? 0) >= 1, {
    message: 'El criterio requiere al menos 1 hábito',
    path: ['criteria', 'habitIds'],
  })
  .refine((v) => v.criteria.type !== 'combined' || (v.criteria.goalIds?.length ?? 0) >= 1, {
    message: 'El criterio combinado requiere ≥1 meta',
    path: ['criteria', 'goalIds'],
  });

export type CreateCustomAchievementInputType = z.infer<typeof CreateCustomAchievementInput>;
export type CustomAchievementCriteriaType = z.infer<typeof CustomAchievementCriteria>;
