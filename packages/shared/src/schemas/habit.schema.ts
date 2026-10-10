import { z } from 'zod';
import {
  HABIT_CATEGORIES,
  HABIT_COLOR_TOKENS,
  HABIT_FREQUENCIES,
} from '../constants/categories';
import { LIMITS } from '../constants/limits';

export const CreateHabitInput = z
  .object({
    name: z.string().trim().min(1).max(LIMITS.HABIT_NAME_MAX),
    icon: z.string().min(1).max(LIMITS.HABIT_ICON_MAX),
    category: z.enum(HABIT_CATEGORIES),
    colorToken: z.enum(HABIT_COLOR_TOKENS),
    frequency: z.enum(HABIT_FREQUENCIES),
    customDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
    targetValue: z.number().int().positive().nullable().optional(),
    unit: z.string().max(LIMITS.HABIT_UNIT_MAX).nullable().optional(),
    reminderTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable()
      .optional(),
  })
  .strict()
  .refine((v) => v.frequency === 'daily' || (v.customDays?.length ?? 0) >= 1, {
    message: 'Frecuencia personalizada requiere al menos 1 día',
    path: ['customDays'],
  });

export const UpdateHabitInput = CreateHabitInput.partial().strict();

export type CreateHabitInputType = z.infer<typeof CreateHabitInput>;
export type UpdateHabitInputType = z.infer<typeof UpdateHabitInput>;
