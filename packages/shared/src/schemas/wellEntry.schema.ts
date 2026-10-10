import { z } from 'zod';
import { LIMITS } from '../constants/limits';

/** HU-11: mood y energía 1–5; 1 entrada por día (upsert por entry_date). */
export const UpsertWellEntryInput = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    mood: z.number().int().min(LIMITS.MOOD_MIN).max(LIMITS.MOOD_MAX),
    energy: z.number().int().min(LIMITS.ENERGY_MIN).max(LIMITS.ENERGY_MAX),
    note: z.string().max(200).optional(),
  })
  .strict();

export type UpsertWellEntryInputType = z.infer<typeof UpsertWellEntryInput>;
