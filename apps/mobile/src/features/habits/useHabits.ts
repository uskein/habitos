import { localDateISO } from '@habitos/shared';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { habitRepository } from '@/core/repositories/habitRepository';
import { streakCacheRepository } from '@/core/repositories/streakCacheRepository';
import { userProfileRepository } from '@/core/repositories/userProfileRepository';
import {
  cancelHabitReminder,
  syncHabitReminder,
} from '@/core/services/notificationService';

export function useHabitsToday() {
  const today = localDateISO();
  return useQuery({
    queryKey: ['habits', today],
    queryFn: () => habitRepository.listByDate(today),
  });
}

export function useGlobalStreak() {
  return useQuery({
    queryKey: ['streaks', 'global'],
    queryFn: () => streakCacheRepository.getGlobal(),
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
    },
  });
}

export function useToggleLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) =>
      habitRepository.toggleLog(habitId, date),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['habits'] });
      void qc.invalidateQueries({ queryKey: ['streaks'] });
      void qc.invalidateQueries({ queryKey: ['achievements'] });
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
    },
  });
}
