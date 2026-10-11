import { type CreateGoalInputType, type GoalStatus } from '@habitos/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goalRepository } from '@/core/repositories/goalRepository';

export function useGoals(status?: GoalStatus) {
  return useQuery({
    queryKey: ['goals', status ?? 'all'],
    queryFn: () => goalRepository.list(status),
  });
}

export function useGoal(goalId: string) {
  return useQuery({
    queryKey: ['goals', 'one', goalId],
    queryFn: () => goalRepository.getById(goalId),
    enabled: !!goalId,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGoalInputType) => goalRepository.create(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useAddProgress(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ delta, note }: { delta: number; note?: string }) =>
      goalRepository.addProgress(goalId, delta, note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals'] });
      void qc.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}

/** V2 · HU-19 — historial de progresos con notas. */
export function useGoalUpdates(goalId: string) {
  return useQuery({
    queryKey: ['goals', 'updates', goalId],
    queryFn: () => goalRepository.getUpdates(goalId),
    enabled: !!goalId,
  });
}

/** V2 · HU-19 — editar nota (misma tx GOAL_UPDATE). */
export function useUpdateGoalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ updateId, note }: { updateId: string; note: string }) =>
      goalRepository.updateNote(updateId, note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals', 'updates'] });
      void qc.invalidateQueries({ queryKey: ['goals', 'stats'] });
      void qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

/** V2 · HU-20 — stats día/hora de meta (4 estados R9). */
export function useGoalStats(goalId: string) {
  return useQuery({
    queryKey: ['goals', 'stats', goalId],
    queryFn: () => goalRepository.getStats(goalId),
    enabled: !!goalId,
    retry: false,
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => goalRepository.delete(goalId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}
