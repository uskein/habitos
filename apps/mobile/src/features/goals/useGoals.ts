import { CreateGoalInput, type CreateGoalInputType, type GoalStatus } from '@habitos/shared';
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
