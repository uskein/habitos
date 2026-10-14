import { localDateISO } from '@habitos/shared';

/** Celda del heatmap anual (M31). */
export interface HeatmapCell {
  /** ISO local del día (null = relleno fuera de rango). */
  date: string | null;
  count: number;
  /** Intensidad 0–4 (rampa de color del Design System). */
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  isFuture: boolean;
}

/** Semana (lun→dom) = columna del heatmap. */
export type HeatmapWeek = HeatmapCell[];

/** Etiqueta de mes por columna: monthIndex si arranca un mes nuevo, si no null. */
export type HeatmapMonthLabels = (number | null)[];

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** Nivel 0–4 relativo al máximo del periodo (día sin logs = 0). ceil de cuartos. */
export function heatmapLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0;
  const level = Math.ceil((count / max) * 4);
  return Math.min(4, Math.max(1, level)) as 1 | 2 | 3 | 4;
}

/**
 * Heatmap de365 días terminando hoy, en columnas lun→dom (M31 · Logros).
 * `counts` mapea ISO local → nº de hábitos completados.
 * Itera por días de calendario (no por ms) para ser inmune a DST.
 */
export function buildYearHeatmap(
  counts: Record<string, number>,
  todayISO: string,
): HeatmapWeek[] {
  const [y, m, d] = todayISO.split('-').map(Number);
  const today = new Date(y!, (m ?? 1) - 1, d ?? 1);
  const max = Math.max(0, ...Object.values(counts));

  // Primer día: hoy -364, retrocedido al lunes de su semana.
  const first = addDays(today, -364);
  const mondayOffset = (first.getDay() + 6) % 7; // 0 = lunes
  const start = addDays(first, -mondayOffset);
  // Último día renderizado: domingo de la semana de hoy.
  const end = addDays(today, 6 - ((today.getDay() + 6) % 7));

  const todayTime = today.getTime();
  const endTime = end.getTime();
  const weeks: HeatmapWeek[] = [];
  let weekIdx = -1;
  for (let cursor = new Date(start); cursor.getTime() <= endTime; cursor = addDays(cursor, 1)) {
    if (cursor.getDay() === 1) weekIdx += 1; // lunes ⇒ nueva columna
    if (!weeks[weekIdx]) weeks[weekIdx] = [];
    const cursorTime = cursor.getTime();
    const inRange = cursorTime >= first.getTime() && cursorTime <= todayTime;
    const iso = localDateISO(cursor);
    const count = inRange ? (counts[iso] ?? 0) : 0;
    weeks[weekIdx]!.push({
      date: inRange ? iso : null,
      count,
      level: heatmapLevel(count, max),
      isToday: cursorTime === todayTime,
      isFuture: cursorTime > todayTime,
    });
  }
  return weeks;
}

/**
 * Etiquetas de mes por columna: número de mes (0–11) en la primera columna
 * cuyo lunes cae en un mes nuevo; null si el mes no cambia.
 */
export function heatmapMonthLabels(weeks: HeatmapWeek[]): HeatmapMonthLabels {
  const labels: HeatmapMonthLabels = [];
  let lastMonth: number | null = null;
  for (const week of weeks) {
    const monday = week.find((c) => c.date !== null) ?? week[0]!;
    const iso = monday.date ?? localDateISO(new Date());
    const month = Number(iso.slice(5, 7)) - 1;
    labels.push(month !== lastMonth ? month : null);
    lastMonth = month;
  }
  return labels;
}
