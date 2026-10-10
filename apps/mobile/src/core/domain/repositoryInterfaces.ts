/**
 * Interfaces de repositorio — CONTRATOS_API §2 (SSOT de la "API" local MVP).
 * Implementaciones en core/repositories; consumidas SOLO vía hooks (regla 2).
 */

import type { AchievementEvent, CreateGoalInputType, CreateHabitInputType } from '@habitos/shared';
import type { Habit, HabitLog, HabitWithLog } from './entities/habit';
import type { Goal, GoalStatus } from './entities/goal';
import type { WellEntry } from './entities/wellEntry';
import type { Achievement, AchievementUnlock } from './entities/achievement';

export interface HabitRepository {
  listByDate(date: string): Promise<HabitWithLog[]>;
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
}

export interface AuthRepository {
  isPinConfigured(): Promise<boolean>;
  setupPin(pin: string): Promise<void>;
  verifyPin(pin: string): Promise<boolean>;
  unlockWithBiometrics(): Promise<boolean>;
  lock(): void;
}
