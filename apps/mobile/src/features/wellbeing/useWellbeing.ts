import { UpsertWellEntryInput, localDateISO, type UpsertWellEntryInputType } from '@habitos/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wellbeingRepository } from '@/core/repositories/wellbeingRepository';

export function useTodayEntry() {
  const today = localDateISO();
  return useQuery({
    queryKey: ['wellbeing', today],
    queryFn: () => wellbeingRepository.getEntry(today),
  });
}

export function useWellMonth(year: number, month: number) {
  return useQuery({
    queryKey: ['wellbeing', 'month', year, month],
    queryFn: () => wellbeingRepository.getMonth(year, month),
  });
}

export function useUpsertEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertWellEntryInputType) => {
      UpsertWellEntryInput.parse(input);
      return wellbeingRepository.upsertEntry(input.date, input.mood, input.energy, input.note);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['wellbeing'] });
      void qc.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}
