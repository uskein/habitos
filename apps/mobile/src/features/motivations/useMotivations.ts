import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { localDateISO, type CreateMotivationInputType } from '@habitos/shared';
import { motivationRepository } from '@/core/repositories/motivationRepository';

/** V2 · HU-24 — lista de motivaciones activas (gestión). */
export function useMotivations() {
  return useQuery({
    queryKey: ['motivations'],
    queryFn: () => motivationRepository.list(),
  });
}

/** V2 · HU-25 · R11 — cola para Hoy (servicio puro, excluye MOTIVATION_SHOW). */
export function useMotivationQueue() {
  return useQuery({
    queryKey: ['motivations', 'queue', localDateISO()],
    queryFn: () => motivationRepository.listQueue(localDateISO()),
  });
}

export function useCreateMotivation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMotivationInputType) => motivationRepository.create(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['motivations'] }),
  });
}

export function useRemoveMotivation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (motivationId: string) => motivationRepository.remove(motivationId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['motivations'] }),
  });
}

/** HU-25 — al descartar (deshacer disponible): registra muestra y refresca. */
export function useShowMotivation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ motivationId, shownOn }: { motivationId: string; shownOn: string }) =>
      motivationRepository.markShown(motivationId, shownOn),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['motivations'] }),
  });
}

/** HU-25 · F17 deshacer — quita la exclusión de hoy. */
export function useUnshowMotivation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ motivationId, shownOn }: { motivationId: string; shownOn: string }) =>
      motivationRepository.unmarkShown(motivationId, shownOn),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['motivations'] }),
  });
}
