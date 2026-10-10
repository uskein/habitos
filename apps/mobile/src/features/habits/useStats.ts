import { useQuery } from '@tanstack/react-query';
import type { TimeSlot } from '@habitos/shared';
import { statsRepository, type HabitStats, type MilestoneActivity } from '@/core/repositories/statsRepository';

/** V2 - HU-26 — stats de hábito (tasa 30 d, hora, tendencia) desde stats_cache.
 *  V2.1 · HU-30 — `timeSlot` opcional filtra día/hora por tramo. */
export function useHabitStats(habitId: string, timeSlot?: TimeSlot | null) {
  const slot = timeSlot ?? null;
  return useQuery({
    queryKey: ['stats', 'habit', habitId, slot],
    queryFn: (): Promise<HabitStats> => statsRepository.getHabitStats(habitId, slot),
    enabled: !!habitId,
    retry: false,
  });
}

/** V2 · HU-26 — actividad del hito (semana antes/después). */
export function useMilestoneActivity(milestoneId: string) {
  return useQuery({
    queryKey: ['stats', 'milestone', milestoneId],
    queryFn: (): Promise<MilestoneActivity> => statsRepository.getMilestoneActivity(milestoneId),
    enabled: !!milestoneId,
    retry: false,
  });
}
