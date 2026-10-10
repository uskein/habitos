import { localDateISO } from '@habitos/shared';
import { useQuery } from '@tanstack/react-query';
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
