import { useQuery } from '@tanstack/react-query';
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
