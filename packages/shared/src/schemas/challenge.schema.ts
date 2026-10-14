import { z } from 'zod';

/** Duraciones permitidas de un reto (días). */
export const CHALLENGE_DAYS = [7, 14, 30, 60, 90] as const;

const ChallengeInputShape = z
  .object({
    name: z.string().trim().min(1).max(60),
    habitId: z.string().min(1),
    days: z.union([
      z.literal(7),
      z.literal(14),
      z.literal(30),
      z.literal(60),
      z.literal(90),
    ]),
  })
  .strict();

export const CreateChallengeInput = ChallengeInputShape;
export type CreateChallengeInputType = z.infer<typeof CreateChallengeInput>;
