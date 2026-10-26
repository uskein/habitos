import { localDateISO } from '@habitos/shared';
import { useQuery } from '@tanstack/react-query';
import { buildYearHeatmap, heatmapMonthLabels, type HeatmapWeek } from '@/core/domain/services/heatmap';
import { statsRepository } from '@/core/repositories/statsRepository';

export function useMonthCompletedDates(year: number, month: number) {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const to =
    month === new Date().getMonth() && year === new Date().getFullYear()
      ? localDateISO()
      : `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`;
  return useQuery({
    queryKey: ['stats', 'month', year, month],
    queryFn: () => statsRepository.getMonthCompletedDates(from, to),
  });
}

/** M31 · heatmap anual de Logros: columnas lun→dom + etiquetas de mes. */
export function useYearHeatmap() {
  return useQuery({
    queryKey: ['stats', 'heatmap'],
    queryFn: async () => {
      const counts = await statsRepository.getYearActivity();
      const weeks: HeatmapWeek[] = buildYearHeatmap(counts, localDateISO());
      return { weeks, labels: heatmapMonthLabels(weeks) };
    },
  });
}

/** M45 · resumen del mes navegado (cumplimiento, ▲▼, perfectos). */
export function useMonthSummary(year: number, month: number) {
  return useQuery({
    queryKey: ['stats', 'summary', year, month],
    queryFn: () => statsRepository.getMonthSummary(year, month),
  });
}
