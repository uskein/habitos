import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateCustomAchievementInputType } from '@habitos/shared';
import { achievementRepository } from '@/core/repositories/achievementRepository';

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements', 'catalog'],
    queryFn: async () => {
      const [catalog, unlocked] = await Promise.all([
        achievementRepository.listCatalog(),
        achievementRepository.listUnlocked(),
      ]);
      return { catalog, unlocked };
    },
  });
}

/** V2 · HU-21 — crear medalla personalizada (is_custom = 1). */
export function useCreateCustomAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomAchievementInputType) => achievementRepository.createCustom(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['achievements'] }),
  });
}

/** V2 · HU-23 — editar medalla propia (semillas → ACHIEVEMENT_SEED_IMMUTABLE). */
export function useUpdateCustomAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      achievementId,
      input,
    }: {
      achievementId: string;
      input: Partial<CreateCustomAchievementInputType>;
    }) => achievementRepository.updateCustom(achievementId, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['achievements'] }),
  });
}

/** V2 · HU-23 — borrar medalla propia con confirmación en UI. */
export function useRemoveCustomAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (achievementId: string) => achievementRepository.removeCustom(achievementId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['achievements'] }),
  });
}
