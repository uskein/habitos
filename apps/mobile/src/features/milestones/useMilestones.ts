import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateMilestoneInputType } from '@habitos/shared';
import { habitRepository } from '@/core/repositories/habitRepository';
import { milestoneRepository } from '@/core/repositories/milestoneRepository';
import { useGoals } from '@/features/goals/useGoals';

/** HU-17/HU-18 — queries de hitos (M15/M16). */
export function useMilestones() {
  return useQuery({
    queryKey: ['milestones'],
    queryFn: () => milestoneRepository.list(),
  });
}

export function useMilestonesByEntity(entityType: 'habit' | 'goal', entityId: string) {
  return useQuery({
    queryKey: ['milestones', entityType, entityId],
    queryFn: () => milestoneRepository.listByEntity(entityType, entityId),
    enabled: !!entityId,
  });
}

export function useMilestone(milestoneId: string) {
  return useQuery({
    queryKey: ['milestones', 'one', milestoneId],
    queryFn: () => milestoneRepository.getById(milestoneId),
    enabled: !!milestoneId,
  });
}

/** Hábitos activos para el selector de ligazones (V2 · listActive). */
export function useActiveHabits() {
  return useQuery({
    queryKey: ['habits', 'active'],
    queryFn: () => habitRepository.listActive(),
  });
}

export { useGoals as useGoalLinks };

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMilestoneInputType) => milestoneRepository.create(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['milestones'] }),
  });
}

export function useRemoveMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) => milestoneRepository.remove(milestoneId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['milestones'] }),
  });
}

export function useSetMilestoneComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, note }: { milestoneId: string; note: string }) =>
      milestoneRepository.setComment(milestoneId, note),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['milestones'] }),
  });
}
