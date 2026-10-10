import { z } from 'zod';
import { LIMITS } from '../constants/limits';

/** V2 · HU-17/HU-18 — hitos con fotos y ligazones. REQUERIMIENTOS §Épica 8. */
export const MilestoneLinkInput = z
  .object({
    entityType: z.enum(['habit', 'goal']),
    entityId: z.string().uuid(),
  })
  .strict();

const MilestoneInputShape = z
  .object({
    title: z.string().trim().min(1).max(LIMITS.MILESTONE_TITLE_MAX),
    note: z.string().trim().max(LIMITS.MILESTONE_NOTE_MAX).nullable().optional(),
    occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    links: z.array(MilestoneLinkInput).min(1).max(LIMITS.MILESTONE_LINKS_MAX),
    imageUris: z.array(z.string().min(1)).max(LIMITS.MILESTONE_IMAGES_MAX).default([]),
  })
  .strict();

// Zod v4: refines separados del shape base (convención habit.schema.ts).
export const CreateMilestoneInput = MilestoneInputShape.refine((v) => v.links.length >= 1, {
  message: 'El hito requiere al menos 1 ligazón a un hábito o meta',
  path: ['links'],
});

export type CreateMilestoneInputType = z.infer<typeof CreateMilestoneInput>;
export type MilestoneLinkInputType = z.infer<typeof MilestoneLinkInput>;

/** Comentario del hito (HU-18). */
export const MilestoneCommentInput = z
  .object({
    note: z.string().trim().min(1).max(LIMITS.MILESTONE_NOTE_MAX),
  })
  .strict();

export type MilestoneCommentInputType = z.infer<typeof MilestoneCommentInput>;
