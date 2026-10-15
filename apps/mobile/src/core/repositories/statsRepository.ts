import { deviceHour, hourInSlot, localDateISO, type TimeSlot } from '@habitos/shared';
import { getDb } from '../data/database';

/** Días con ≥1 hábito completado en el rango (calendario global). */
async function getMonthCompletedDates(from: string, to: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ log_date: string }>(
    `SELECT DISTINCT log_date FROM habit_log
     WHERE completed = 1 AND log_date >= ? AND log_date <= ?
     ORDER BY log_date`,
    from,
    to,
  );
  return rows.map((r) => r.log_date);
}

/** M31 · heatmap anual — nº de hábitos completados por día en los últimos365 días. */
async function getYearActivity(): Promise<Record<string, number>> {
  const db = await getDb();
  const from = addDaysISO(localDateISO(), -364);
  const rows = await db.getAllAsync<{ log_date: string; n: number }>(
    `SELECT log_date, COUNT(*) AS n FROM habit_log
     WHERE completed = 1 AND log_date >= ?
     GROUP BY log_date`,
    from,
  );
  return Object.fromEntries(rows.map((r) => [r.log_date, r.n]));
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return localDateISO(date);
}

/** V2 · HU-26 — tasa 30 días + hora + tendencia (ClayBars/Victory/ClaySparkline). */
export interface HabitStats {
  /** Tasa de cumplimiento % en los últimos 30 días. */
  rate30: number;
  /** 30 barras (0–100 %) para ClayBars; label solo cada 7 días. */
  daily30: { label: string; value: number }[];
  /** Registros por hora del día (0–23) para Victory. */
  hourly: number[];
  /** Tendencia de 14 puntos (0–100) para ClaySparkline. */
  trend: number[];
}

/** V2 · HU-26 — actividad de la semana antes/después de un hito. */
export interface MilestoneActivity {
  milestoneId: string;
  /** Días con ≥1 hábito completado — semana previa al hito. */
  before: number;
  /** Semana posterior al hito. */
  after: number;
}

/** M38 · consistencia semanal por día de la semana (Lun–Dom). */
export interface WeeklyConsistency {
  /** Array de 7 elementos: Lun=0 ... Dom=6. Valor 0–100. */
  days: { day: number; label: string; value: number }[];
}

const CACHE_TTL_HOURS = 24;

async function readCache<T>(key: string): Promise<T | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ payload: string; computed_at: string }>(
    'SELECT payload, computed_at FROM stats_cache WHERE key = ?',
    key,
  );
  if (!row) return null;
  const ageMs = Date.now() - new Date(row.computed_at.replace(' ', 'T') + 'Z').getTime();
  if (!Number.isFinite(ageMs) || ageMs > CACHE_TTL_HOURS * 3_600_000) return null;
  try {
    return JSON.parse(row.payload) as T;
  } catch {
    return null;
  }
}

async function writeCache(key: string, payload: unknown): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO stats_cache (key, payload, computed_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, computed_at = datetime('now')`,
    key,
    JSON.stringify(payload),
  );
}

function pct(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

export const statsRepository = {
  getMonthCompletedDates,
  getYearActivity,

  /**
   * M38 · consistencia semanal: % de días completados por día de la semana (Lun–Dom)
   * en los últimos 90 días (o desde el primer log si hay menos).
   */
  async getWeeklyConsistency(): Promise<WeeklyConsistency> {
    const db = await getDb();
    const today = localDateISO();
    const d0 = new Date(today + 'T00:00:00');
    const start90 = new Date(d0);
    start90.setDate(start90.getDate() - 89); // 90 días incluyendo hoy

    const rows = await db.getAllAsync<{ weekday: number | null; total: number; done: number }>(
      `SELECT
         (strftime('%w', log_date) + 6) % 7 AS weekday, -- 0=Lun ... 6=Dom
         COUNT(*) AS total,
         SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS done
       FROM habit_log
       WHERE log_date >= ? AND log_date <= ?
       GROUP BY weekday`,
      localDateISO(start90),
      localDateISO(),
    );

    const daysByWeekday = new Map<number, { total: number; done: number }>();
    for (let i = 0; i < 7; i++) daysByWeekday.set(i, { total: 0, done: 0 });

    for (const r of rows) {
      const wd = r.weekday ?? 0;
      const acc = daysByWeekday.get(wd);
      if (acc) {
        acc.total += r.total;
        acc.done += r.done;
      }
    }

    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return {
      days: labels.map((label, i) => {
        const { total, done } = daysByWeekday.get(i) ?? { total: 0, done: 0 };
        return {
          day: i,
          label,
          value: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      }),
    };
  },

  /**
   * V2 · HU-26 — stats del hábito desde stats_cache (TTL 24 h).
   * tasa 30 d → ClayBars; distribución por hora → Victory; tendencia → ClaySparkline.
   * V2.1 · HU-30 — `timeSlot` opcional: filtra día y hora por tramo (sin tramo = sin filtro).
   */
  async getHabitStats(habitId: string, timeSlot?: TimeSlot | null): Promise<HabitStats> {
    const slot = timeSlot ?? null;
    // v2 → bustea caches viejos guardados con hora UTC y rangos con drift.
    const key = `habit:${habitId}:v2${slot ? `:${slot}` : ''}`;
    const cached = await readCache<HabitStats>(key);
    if (cached) return cached;

    const db = await getDb();
    const today = localDateISO();
    const d0 = new Date(today + 'T00:00:00');
    const start30 = new Date(d0);
    start30.setDate(start30.getDate() - 29);

    const rows = await db.getAllAsync<{ log_date: string; created_at: string; completed_at: string | null }>(
      `SELECT log_date, created_at, completed_at FROM habit_log
       WHERE habit_id = ? AND completed = 1 AND log_date >= ?`,
      habitId,
      localDateISO(start30),
    );

    // HU-30 — con tramo: sólo cuenta el log cuya hora DEL DISPOSITIVO cae en él.
    const inSlot = slot
      ? rows.filter((r) => {
          const hour = deviceHour(r.completed_at || r.created_at);
          return hour !== null && hourInSlot(hour, slot);
        })
      : rows;

    const days: { date: string; done: boolean }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(start30);
      d.setDate(d.getDate() + i);
      days.push({ date: localDateISO(d), done: false });
    }
    const doneDates = new Set(inSlot.map((r) => r.log_date));
    const byDate = new Map(days.map((d) => [d.date, d]));
    for (const date of doneDates) {
      const day = byDate.get(date);
      if (day) day.done = true;
    }

    const doneCount = days.filter((d) => d.done).length;
    const daily30 = days.map((d, i) => ({
      label: i % 7 === 0 ? d.date.slice(8) : '',
      value: d.done ? 100 : 0,
    }));

    const hourly = new Array<number>(24).fill(0);
    for (const r of inSlot) {
      const hour = deviceHour(r.completed_at || r.created_at);
      if (hour !== null) hourly[hour] = (hourly[hour] ?? 0) + 1;
    }

    const trend: number[] = [];
    for (let i = days.length - 14; i < days.length; i++) {
      trend.push(days[i]?.done ? 100 : 0);
    }

    const stats: HabitStats = { rate30: pct(doneCount, 30), daily30, hourly, trend };
    await writeCache(key, stats);
    return stats;
  },

  /** V2 · HU-26 — actividad de hito: días con log en la semana antes/después. */
  async getMilestoneActivity(milestoneId: string): Promise<MilestoneActivity> {
    const key = `milestone:activity:${milestoneId}`;
    const cached = await readCache<MilestoneActivity>(key);
    if (cached) return cached;

    const db = await getDb();
    const milestone = await db.getFirstAsync<{ occurred_at: string }>(
      'SELECT occurred_at FROM milestone WHERE id = ?',
      milestoneId,
    );
    if (!milestone) {
      return { milestoneId, before: 0, after: 0 };
    }

    const day0 = new Date(milestone.occurred_at + 'T00:00:00');
    const from = new Date(day0);
    from.setDate(from.getDate() - 7);
    const to = new Date(day0);
    to.setDate(to.getDate() + 7);

    const rows = await db.getAllAsync<{ log_date: string }>(
      `SELECT DISTINCT log_date FROM habit_log
       WHERE completed = 1 AND log_date > ? AND log_date < ?
       ORDER BY log_date`,
      localDateISO(from),
      localDateISO(to),
    );
    const hitoDate = milestone.occurred_at;
    const before = rows.filter((r) => r.log_date < hitoDate).length;
    const after = rows.filter((r) => r.log_date > hitoDate).length;

    const activity: MilestoneActivity = { milestoneId, before, after };
    await writeCache(key, activity);
    return activity;
  },
};
