/** Entidades MOTIVATION / MOTIVATION_SHOW — MODELO §2.9 */

import type { MotivationTrigger } from '@habitos/shared';

export interface Motivation {
  id: string;
  userId: string;
  text: string;
  emoji: string;
  goalId: string | null;
  triggerType: MotivationTrigger;
  active: boolean;
  createdAt: string;
}

/** Elemento encolado para el swipe de Hoy (HU-25). */
export interface QueuedMotivation extends Motivation {
  /** Orden: metas sin racha primero (motivationQueueService). */
  goalTitle?: string;
}
