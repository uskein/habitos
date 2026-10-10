import type { QueuedMotivation } from '../entities/motivation';

/**
 * motivationQueueService (V2 · HU-25 · R11) — lógica PURA de la cola de
 * motivaciones para Hoy: máximo MOTIVATION_QUEUE_MAX, excluye las ya
 * mostradas hoy (MOTIVATION_SHOW) y ordena las ligadas a una meta
 * (sin racha) primero. Sin acceso a base de datos.
 */
export const MOTIVATION_QUEUE_MAX = 5;

export function pickQueue(
  items: QueuedMotivation[],
  shownToday: ReadonlySet<string>,
  limit: number = MOTIVATION_QUEUE_MAX,
): QueuedMotivation[] {
  return items
    .filter((m) => !shownToday.has(m.id))
    .sort((a, b) => {
      const goalFirst = Number(!a.goalId) - Number(!b.goalId);
      if (goalFirst !== 0) return goalFirst;
      if (a.createdAt === b.createdAt) return 0;
      return a.createdAt < b.createdAt ? 1 : -1; // más recientes primero
    })
    .slice(0, limit);
}
