import { buildYearHeatmap, heatmapLevel, heatmapMonthLabels } from '../heatmap';

describe('heatmapLevel (M31 · intensidad)', () => {
  it('día sin actividad o max 0 ⇒ nivel 0', () => {
    expect(heatmapLevel(0, 5)).toBe(0);
    expect(heatmapLevel(3, 0)).toBe(0);
  });

  it('escala relativa al máximo del periodo (ceil de cuartos)', () => {
    expect(heatmapLevel(1, 4)).toBe(1); // 25 % exacto ⇒ nivel 1
    expect(heatmapLevel(2, 4)).toBe(2); // 50 % exacto ⇒ nivel 2
    expect(heatmapLevel(3, 4)).toBe(3); // 75 % exacto ⇒ nivel 3
    expect(heatmapLevel(4, 4)).toBe(4); // 100 % ⇒ nivel 4
  });

  it('valores por debajo del 25 % quedan en nivel 1 (con actividad mínima)', () => {
    expect(heatmapLevel(1, 10)).toBe(1);
  });
});

describe('buildYearHeatmap (M31 · grid lun→dom)', () => {
  //2026-10-14 es miércoles.
  const weeks = buildYearHeatmap({ '2026-10-14': 3, '2026-10-13': 1 }, '2026-10-14');
  const flat = weeks.flat();

  it('cada columna tiene7 celdas y hay entre53 y54 columnas', () => {
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks.length).toBeGreaterThanOrEqual(53);
    expect(weeks.length).toBeLessThanOrEqual(54);
  });

  it('marca exactamente un día como hoy', () => {
    const todays = flat.filter((c) => c.isToday);
    expect(todays).toHaveLength(1);
    expect(todays[0]!.date).toBe('2026-10-14');
  });

  it('el rango cubre365 días fechados (el resto es relleno/futuro)', () => {
    expect(flat.filter((c) => c.date !== null)).toHaveLength(365);
  });

  it('los días posteriores a hoy son futuro con nivel 0', () => {
    const future = flat.filter((c) => c.isFuture);
    expect(future.length).toBeGreaterThan(0);
    expect(future.every((c) => c.level === 0 && c.date === null)).toBe(true);
  });

  it('aplica el conteo y la intensidad relativa', () => {
    const cell = flat.find((c) => c.date === '2026-10-14')!;
    expect(cell.count).toBe(3);
    expect(cell.level).toBe(4); // 3 de un max de3 ⇒ 100 %
    const prev = flat.find((c) => c.date === '2026-10-13')!;
    expect(prev.count).toBe(1);
    expect(prev.level).toBe(2); // 1 de un max de3 ⇒ ceil(1.33) = 2
  });
});

describe('heatmapMonthLabels (M31 · etiquetas)', () => {
  it('etiqueta la primera columna de cada mes y null en el resto', () => {
    const weeks = buildYearHeatmap({}, '2026-10-14');
    const labels = heatmapMonthLabels(weeks);
    expect(labels).toHaveLength(weeks.length);
    const monthChanges = labels.filter((l) => l !== null).length;
    //365 días ⇒ al menos12 cambios de mes (uno por mes).
    expect(monthChanges).toBeGreaterThanOrEqual(12);
    expect(labels[0]).not.toBeNull();
    expect(new Set(labels.filter((l) => l !== null))).toEqual(
      new Set([9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8]),
    );
  });
});
