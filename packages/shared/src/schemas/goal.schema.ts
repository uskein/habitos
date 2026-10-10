import { z } from 'zod';
import { GOAL_STATUSES } from '../constants/categories';

/** HU-9: objetivo numérico positivo. */
export const CreateGoalInput = z
  .object({
    title: z.string().trim().min(1).max(80),
    targetValue: z.number().positive(),
    unit: z.string().max(12).optional(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .strict();

/** HU-10: delta puede ser negativo (corrección). */
export const AddProgressInput = z
  .object({
    delta: z.number().refine((n) => n !== 0, { message: 'delta no puede ser 0' }),
    note: z.string().max(120).optional(),
  })
  .strict();

export type CreateGoalInputType = z.infer<typeof CreateGoalInput>;
export type AddProgressInputType = z.infer<typeof AddProgressInput>;
