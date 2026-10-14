/** Entidad CHALLENGE — M36 · retos locales (p. ej. «30 días de …»). */

export type ChallengeStatus = 'active' | 'completed';

export interface Challenge {
  id: string;
  name: string;
  habitId: string;
  days: number;
  /** Fecha ISO local de inicio del reto. */
  startDate: string;
  status: ChallengeStatus;
  createdAt: string;
}

/** Reto con sus datos de hábito (join) para la UI. */
export interface ChallengeWithHabit extends Challenge {
  habitName: string;
  habitIcon: string;
}

/** Reto + progreso calculado (M36). */
export interface ChallengeProgress {
  challenge: ChallengeWithHabit;
  /** Día calendario del reto (1-based; hoy = primero). */
  currentDay: number;
  /** Hábito completado en N días distintos desde el inicio. */
  completedDays: number;
  /** % de avance sobre `days` (0–100). */
  percent: number;
}
