/**
 * Interfaces de repositorio — CONTRATOS_API §2 (SSOT de la "API" local MVP).
 * Implementaciones en core/repositories; consumidas SOLO vía hooks (regla 2).
 */

import type { AchievementEvent, CreateGoalInputType, CreateHabitInputType, CreateMilestoneInputType, CreateMotivationInputType, CreateCustomAchievementInputType } from '@habitos/shared';
import type { Habit, HabitLog, HabitWithLog } from './entities/habit';
import type { Goal, GoalStatus, GoalStats, GoalUpdate } from './entities/goal';
import type { WellEntry } from './entities/wellEntry';
import type { Achievement, AchievementUnlock } from './entities/achievement';
import type { Milestone, MilestoneEntityType, MilestoneWithMedia } from './entities/milestone';
import type { Motivation, QueuedMotivation } from './entities/motivation';

export interface HabitRepository {
  listByDate(date: string): Promise<HabitWithLog[]>;
  /** V2 · HU-17 — hábitos no archivados (selector de ligazones de hitos). */
  listActive(): Promise<Habit[]>;
  getById(habitId: string): Promise<Habit | null>;
  create(input: CreateHabitInputType): Promise<Habit>;
  update(habitId: string, input: Partial<CreateHabitInputType>): Promise<Habit>;
  toggleLog(habitId: string, date: string): Promise<HabitLog>;
  getHistory(habitId: string, from: string, to: string): Promise<HabitLog[]>;
  archive(habitId: string): Promise<void>;
  delete(habitId: string): Promise<void>;
}

export interface GoalRepository {
  list(status?: GoalStatus): Promise<Goal[]>;
  getById(goalId: string): Promise<Goal | null>;
  create(input: CreateGoalInputType): Promise<Goal>;
  addProgress(goalId: string, delta: number, note?: string): Promise<Goal>;
  setStatus(goalId: string, status: GoalStatus): Promise<Goal>;
  delete(goalId: string): Promise<void>;
  /** V2 · HU-19 — historial de progresos con notas. */
  getUpdates(goalId: string): Promise<GoalUpdate[]>;
  /** V2 · HU-19 — editar nota en la misma transacción GOAL_UPDATE. */
  updateNote(updateId: string, note: string): Promise<GoalUpdate>;
  /** V2 · HU-20 — stats 7 días + hora pico. */
  getStats(goalId: string): Promise<GoalStats>;
}

export interface WellbeingRepository {
  upsertEntry(date: string, mood: number, energy: number, note?: string): Promise<WellEntry>;
  getEntry(date: string): Promise<WellEntry | null>;
  getMonth(year: number, month: number): Promise<WellEntry[]>;
  countAll(): Promise<number>;
}

export interface AchievementRepository {
  listCatalog(): Promise<Achievement[]>;
  listUnlocked(): Promise<AchievementUnlock[]>;
  evaluateAndUnlock(event: AchievementEvent): Promise<AchievementUnlock | null>;
  /** V2 · HU-21 — medalla personalizada (is_custom = 1). */
  createCustom(input: CreateCustomAchievementInputType): Promise<Achievement>;
  /** V2 · HU-23 — editar/eliminar; semillas (is_custom = 0) → ACHIEVEMENT_SEED_IMMUTABLE. */
  updateCustom(achievementId: string, input: Partial<CreateCustomAchievementInputType>): Promise<Achievement>;
  removeCustom(achievementId: string): Promise<void>;
}

/** V2 · HU-17/HU-18 — hitos. MODELO §2.8 · CONTRATOS §V2. */
export interface MilestoneRepository {
  list(): Promise<MilestoneWithMedia[]>;
  getById(milestoneId: string): Promise<MilestoneWithMedia | null>;
  listByEntity(entityType: MilestoneEntityType, entityId: string): Promise<MilestoneWithMedia[]>;
  create(input: CreateMilestoneInputType): Promise<MilestoneWithMedia>;
  setComment(milestoneId: string, note: string): Promise<MilestoneWithMedia>;
  remove(milestoneId: string): Promise<void>;
}

/** V2 · HU-24/HU-25 — motivaciones. MODELO §2.9. */
export interface MotivationRepository {
  list(): Promise<Motivation[]>;
  create(input: CreateMotivationInputType): Promise<Motivation>;
  remove(motivationId: string): Promise<void>;
  listQueue(today: string, limit?: number): Promise<QueuedMotivation[]>;
  markShown(motivationId: string, shownOn: string): Promise<void>;
  unmarkShown(motivationId: string, shownOn: string): Promise<void>;
}

/** V2.1 · HU-27 — racha con freeze (tabla streak_freeze, cuota 2/mes). */
export interface StreakRepository {
  availableFreezes(month: string): Promise<number>;
  /** Consume 1 freeze para `date`. Cuota agotada → FREEZE_QUOTA_EXCEEDED. */
  consumeFreeze(date: string): Promise<boolean>;
  /** Desactiva el freeze manual de `date` (solo si existe). */
  releaseFreeze(date: string): Promise<void>;
  /** ¿Existe un freeze protegiendo `date`? */
  hasFreeze(date: string): Promise<boolean>;
}

export interface AuthRepository {
  isPinConfigured(): Promise<boolean>;
  setupPin(pin: string): Promise<void>;
  verifyPin(pin: string): Promise<boolean>;
  unlockWithBiometrics(): Promise<boolean>;
  lock(): void;
}
