import { localDateISO } from '@habitos/shared';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useRef } from 'react';
import { habitRepository } from '@/core/repositories/habitRepository';
import { getWeekCompletedDays, getWeekProgressByHabit, getWeeklyTrend } from '@/core/repositories/habitTrendRepository';
import { streakCacheRepository } from '@/core/repositories/streakCacheRepository';
import { userProfileRepository } from '@/core/repositories/userProfileRepository';
import { statsRepository } from '@/core/repositories/statsRepository';
import {
  cancelHabitReminder,
  syncEveningReminders,
  syncHabitReminder,
} from '@/core/services/notificationService';
import { useToast } from '@/ui/feedback/Toast';

export function useHabitsToday() {
  const today = localDateISO();
  return useQuery({
    queryKey: ['habits', today],
    queryFn: () => habitRepository.listByDate(today),
  });
}

/** Hábitos activos (no archivados) — selector de retos (M36). */
export function useHabitsActive() {
  return useQuery({
    queryKey: ['habits', 'active'],
    queryFn: () => habitRepository.listActive(),
  });
}

/** M39 · tendencia semanal por hábito (sparkline de Plan). */
export function useWeeklyTrend() {
  return useQuery({
    queryKey: ['habits', 'weekly-trend'],
    queryFn: () => getWeeklyTrend(),
  });
}

/** M40 · meta semanal — días completados esta semana (lun→dom). */
export function useWeekCompletedDays() {
  return useQuery({
    queryKey: ['habits', 'week-completed-days'],
    queryFn: () => getWeekCompletedDays(),
  });
}

/** M42 · progreso de meta semanal por hábito (chip 🎯 N/M en las tarjetas). */
export function useWeekProgressByHabit() {
  return useQuery({
    queryKey: ['habits', 'week-progress'],
    queryFn: () => getWeekProgressByHabit(),
  });
}

export function useGlobalStreak() {
  return useQuery({
    queryKey: ['streaks', 'global'],
    queryFn: () => streakCacheRepository.getGlobal(),
  });
}

export function useWeeklyConsistency() {
  return useQuery({
    queryKey: ['stats', 'weekly-consistency'],
    queryFn: () => statsRepository.getWeeklyConsistency(),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => userProfileRepository.get(),
  });
}

export function useHabit(habitId: string) {
  return useQuery({
    queryKey: ['habits', 'one', habitId],
    queryFn: () => habitRepository.getById(habitId),
    enabled: !!habitId,
  });
}

export function useHabitHistory(habitId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['habits', 'history', habitId, from, to],
    queryFn: () => habitRepository.getHistory(habitId, from, to),
    enabled: !!habitId,
  });
}

export function useArchiveHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) => habitRepository.archive(habitId),
    onSuccess: (_data, habitId) => {
      void qc.invalidateQueries({ queryKey: ['habits'] });
      void cancelHabitReminder(habitId);
      void syncEveningReminders();
    },
  });
}

export function useToggleLog() {
  const qc = useQueryClient();
  const toast = useToast();
  /** M43 · ¿este toggle consumió un día de gracia (freeze automático)? */
  const freezeConsumed = useRef(false);

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      // M43 · detecta consumo de gracia: si tras el toggle quedan MENOS
      // freezes disponibles, la racha se salvó con un día de gracia.
      const month = date.slice(0, 7);
      const before = await streakCacheRepository.availableFreezes(month);
      const log = await habitRepository.toggleLog(habitId, date);
      const after = await streakCacheRepository.availableFreezes(month);
      freezeConsumed.current = after < before;
      return log;
    },
    onSuccess: () => {
      // La invalidación por prefijo ['habits'] cubre también weekly-trend
      // y week-completed-days.
      void qc.invalidateQueries({ queryKey: ['habits'] });
      void qc.invalidateQueries({ queryKey: ['streaks'] });
      void qc.invalidateQueries({ queryKey: ['achievements'] });
      void qc.invalidateQueries({ queryKey: ['freezes'] });
      // M41 · el cierre del día depende de qué esté pendiente.
      void syncEveningReminders();
      // M43 · avisa cuando un día de gracia mantuvo viva la racha.
      if (freezeConsumed.current) {
        freezeConsumed.current = false;
        toast.show('❄ Racha salvada — se usó 1 día de gracia', 'success');
      }
    },
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof habitRepository.create>[0]) =>
      habitRepository.create(input),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: ['habits'] });
      void qc.invalidateQueries({ queryKey: ['achievements'] });
      void syncHabitReminder(created);
      void syncEveningReminders();
    },
  });
}
