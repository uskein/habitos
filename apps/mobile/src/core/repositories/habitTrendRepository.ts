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

/**
 * M42 · semana natural actual (lunes→domingo) como fechas YYYY-MM-DD.
 * Compartida por la meta semanal global y el progreso por hábito.
 */
function currentWeekRange(): { from: string; to: string } {
  const today = new Date();
  const [y, m, d] = localDateISO(today).split('-').map(Number);
  const todayDate = new Date(y!, (m ?? 1) - 1, d ?? 1);
  const mondayOffset = (todayDate.getDay() + 6) % 7; // 0 = lunes
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - mondayOffset);
  return { from: localDateISO(monday), to: localDateISO(todayDate) };
}

/**
 * M40 · meta semanal — nº de días con ≥1 hábito completado en la semana
 * natural actual (lunes→domingo).
 */
export async function getWeekCompletedDays(): Promise<number> {
  const db = await getDb();
  const { from, to } = currentWeekRange();

  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(DISTINCT log_date) AS n FROM habit_log
     WHERE completed = 1 AND log_date >= ? AND log_date <= ?`,
    from,
    to,
  );
  return row?.n ?? 0;
}

/**
 * M42 · progreso de meta semanal POR HÁBITO — días completados esta semana
 * natural (lun→dom) en cada hábito, para el chip 🎯 N/M de las tarjetas.
 */
export async function getWeekProgressByHabit(): Promise<Record<string, number>> {
  const db = await getDb();
  const { from, to } = currentWeekRange();

  const rows = await db.getAllAsync<{ habit_id: string; n: number }>(
    `SELECT habit_id, COUNT(DISTINCT log_date) AS n FROM habit_log
     WHERE completed = 1 AND log_date >= ? AND log_date <= ?
     GROUP BY habit_id`,
    from,
    to,
  );

  const result: Record<string, number> = {};
  for (const r of rows) result[r.habit_id] = r.n;
  return result;
}
