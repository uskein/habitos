import { z } from 'zod';
import { LIMITS } from '../constants/limits';

/**
 * Sync batch — DISEÑADO para Fase 2, NO implementar aún (ADR-001).
 * El outbox local produce ops con esta forma.
 */
export const SYNC_ENTITIES = ['habit', 'habit_log', 'goal', 'goal_update', 'well_entry'] as const;
export const SYNC_OPS = ['create', 'update', 'delete'] as const;

export const SyncOp = z
  .object({
    opId: z.string().uuid(),
    entity: z.enum(SYNC_ENTITIES),
    entityId: z.string().uuid(),
    op: z.enum(SYNC_OPS),
    payload: z.record(z.string(), z.unknown()),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const SyncBatchRequest = z
  .object({
    ops: z.array(SyncOp).max(LIMITS.SYNC_MAX_OPS_PER_BATCH),
    cursor: z.string().nullable().optional(),
  })
  .strict();

export type SyncOpType = z.infer<typeof SyncOp>;
export type SyncBatchRequestType = z.infer<typeof SyncBatchRequest>;
export type SyncEntity = (typeof SYNC_ENTITIES)[number];
