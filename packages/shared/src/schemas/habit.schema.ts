import { z } from 'zod';
import {
  HABIT_CATEGORIES,
  HABIT_COLOR_TOKENS,
  HABIT_FREQUENCIES,
} from '../constants/categories';
import { LIMITS, TIME_SLOTS } from '../constants/limits';

const HabitInputShape = z
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
    /** V2.1 · HU-30 — tramo opcional (mañana/tarde/noche). */
    timeSlot: z.enum(TIME_SLOTS).nullable().optional(),
    /** V5 · M42 — meta semanal: días por semana que quieres completarlo (1–7). */
    weeklyTarget: z.number().int().min(1).max(7).nullable().optional(),
  })
  .strict();

// Zod v4: .partial() no admite schemas con checks encadenados → separar base y refine.
const customDaysRule = (v: { frequency?: string; customDays?: number[] }) =>
  v.frequency === undefined || v.frequency === 'daily' || (v.customDays?.length ?? 0) >= 1;
const customDaysMsg: { message: string; path: string[] } = {
  message: 'Frecuencia personalizada requiere al menos 1 día',
  path: ['customDays'],
};

export const CreateHabitInput = HabitInputShape.refine(customDaysRule, customDaysMsg);

export const UpdateHabitInput = HabitInputShape.partial().strict().refine(customDaysRule, customDaysMsg);

export type CreateHabitInputType = z.infer<typeof CreateHabitInput>;
export type UpdateHabitInputType = z.infer<typeof UpdateHabitInput>;
