import { z } from 'zod';
import { LIMITS } from '../constants/limits';

export const MOTIVATION_TRIGGERS = ['no_streak', 'morning', 'missed_day'] as const;
export type MotivationTrigger = (typeof MOTIVATION_TRIGGERS)[number];

/** V2 · HU-24 — cards motivacionales descartables. */
export const CreateMotivationInput = z
  .object({
    text: z.string().trim().min(1).max(LIMITS.MOTIVATION_TEXT_MAX),
    emoji: z.string().trim().max(4).default('🔥'),
    goalId: z.string().uuid().nullable().optional(),
    triggerType: z.enum(MOTIVATION_TRIGGERS).default('no_streak'),
  })
  .strict();

export type CreateMotivationInputType = z.infer<typeof CreateMotivationInput>;
