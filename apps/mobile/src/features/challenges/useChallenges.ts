import { localDateISO } from '@habitos/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { challengeRepository } from '@/core/repositories/challengeRepository';
import {
  challengeCurrentDay,
  challengePercent,
} from '@/core/domain/services/challengeProgress';
import type { ChallengeProgress } from '@/core/domain/entities/challenge';

/** Retos activos con progreso calculado (M36). */
export function useChallenges() {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: async (): Promise<ChallengeProgress[]> => {
      const rows = await challengeRepository.listActive();
      const today = localDateISO();
      return rows.map((row) => ({
        challenge: row,
        currentDay: challengeCurrentDay(row.startDate, today),
        completedDays: row.completedDays,
        percent: challengePercent(row.completedDays, row.days),
      }));
    },
  });
}

export function useCreateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof challengeRepository.create>[0]) =>
      challengeRepository.create(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['challenges'] }),
  });
}

export function useRemoveChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => challengeRepository.remove(challengeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['challenges'] });
      void qc.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}

export function useCompleteChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => challengeRepository.markCompleted(challengeId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['challenges'] }),
  });
}
