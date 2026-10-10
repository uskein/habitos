import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { localDateISO } from '@habitos/shared';
import { streakCacheRepository } from '@/core/repositories/streakCacheRepository';

/**
 * HU-27 · V2 — freezes de racha (cuota 2/mes).
 * `available` = restantes; `frozenToday` = hoy ya está protegido.
 */
export function useFreezes() {
  const today = localDateISO();
  const month = today.slice(0, 7);
  return useQuery({
    queryKey: ['freezes', month],
    queryFn: async () => {
      const [available, frozenToday] = await Promise.all([
        streakCacheRepository.availableFreezes(month),
        streakCacheRepository.hasFreeze(today),
      ]);
      return { available, frozenToday, used: Math.max(0, 2 - available) };
    },
  });
}

/** Activa (consume) o desactiva (libera) el freeze de `date`. */
export function useToggleFreeze() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, activate }: { date: string; activate: boolean }) =>
      activate
        ? streakCacheRepository.consumeFreeze(date)
        : streakCacheRepository.releaseFreeze(date).then(() => true),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['freezes'] });
      void qc.invalidateQueries({ queryKey: ['streaks'] });
    },
  });
}
