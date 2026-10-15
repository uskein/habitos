import { localDateISO } from '@habitos/shared';
import { getDb } from '../data/database';

/**
 * M39 · tendencia semanal por hábito —7 últimos días (0/1 por día, de
 * más antiguo a hoy) para el sparkline de las tarjetas de Plan.
 */
export async function getWeeklyTrend(): Promise<Record<string, number[]>> {
  const db = await getDb();
  const from = localDateISO(new Date(Date.now() - 6 * 86_400_000));
  const to = localDateISO();

  const rows = await db.getAllAsync<{ habit_id: string; log_date: string }>(
    `SELECT habit_id, log_date FROM habit_log
     WHERE completed = 1 AND log_date >= ? AND log_date <= ?
     GROUP BY habit_id, log_date`,
    from,
    to,
  );

  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(localDateISO(new Date(Date.now() - i * 86_400_000)));
  }

  const byHabit = new Map<string, Set<string>>();
  for (const r of rows) {
    let set = byHabit.get(r.habit_id);
    if (!set) {
      set = new Set();
      byHabit.set(r.habit_id, set);
    }
    set.add(r.log_date);
  }

  const result: Record<string, number[]> = {};
  for (const [habitId, dates] of byHabit) {
    result[habitId] = days.map((d) => (dates.has(d) ? 1 : 0));
  }
  return result;
}
