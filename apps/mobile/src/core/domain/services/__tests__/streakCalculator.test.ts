import {
  addDays,
  computeGlobalStreak,
  computeStreak,
  daysBetween,
} from '../streakCalculator';

describe('daysBetween / addDays', () => {
  test('diferencia de días simple', () => {
    expect(daysBetween('2026-01-01', '2026-01-04')).toBe(3);
  });

  test('addDays cruza meses', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
  });
});

describe('computeStreak', () => {
  const today = '2026-10-10';

  test('lista vacía → 0/0/null', () => {
    expect(computeStreak([], today)).toEqual({
      currentStreak: 0,
      bestStreak: 0,
      lastCompletedDate: null,
    });
  });

  test('solo hoy → racha viva de 1', () => {
    const r = computeStreak(['2026-10-10'], today);
    expect(r.currentStreak).toBe(1);
    expect(r.bestStreak).toBe(1);
    expect(r.lastCompletedDate).toBe('2026-10-10');
  });

  test('3 días consecutivos hasta hoy → racha 3', () => {
    const r = computeStreak(['2026-10-08', '2026-10-09', '2026-10-10'], today);
    expect(r.currentStreak).toBe(3);
    expect(r.bestStreak).toBe(3);
  });

  test('termina ayer → racha sigue viva', () => {
    const r = computeStreak(['2026-10-08', '2026-10-09'], today);
    expect(r.currentStreak).toBe(2);
  });

  test('hueco de 2 días → racha rota (0) pero récord se conserva', () => {
    const r = computeStreak(['2026-10-05', '2026-10-06', '2026-10-07'], today);
    expect(r.currentStreak).toBe(0);
    expect(r.bestStreak).toBe(3);
    expect(r.lastCompletedDate).toBe('2026-10-07');
  });

  test('mejor racha histórica supera a la actual', () => {
    const r = computeStreak(
      ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-10-10'],
      today,
    );
    expect(r.currentStreak).toBe(1);
    expect(r.bestStreak).toBe(4);
  });

  test('fechas duplicadas se ignoran', () => {
    const r = computeStreak(['2026-10-10', '2026-10-10', '2026-10-09'], today);
    expect(r.currentStreak).toBe(2);
    expect(r.bestStreak).toBe(2);
  });
});

describe('computeGlobalStreak', () => {
  test('equivale a computeStreak sobre días con ≥1 log', () => {
    const dates = ['2026-10-09', '2026-10-10'];
    expect(computeGlobalStreak(dates, '2026-10-10')).toEqual(
      computeStreak(dates, '2026-10-10'),
    );
  });
});

describe('computeStreak — freezes (HU-27, V2.1)', () => {
  const today = '2026-10-10';

  test('sin freezes la racha rota sigue en 0 (comportamiento V1)', () => {
    const r = computeStreak(['2026-10-07'], today);
    expect(r.currentStreak).toBe(0);
  });

  test('1 freeze tapa 1 día perdido — racha viva', () => {
    // último log 08, hoy 10 → hueco de 1 día (09)
    const r = computeStreak(['2026-10-08'], today, 1);
    expect(r.currentStreak).toBe(2);
    expect(r.bestStreak).toBe(1); // histórico intacto
  });

  test('freeze insuficiente no congela', () => {
    // 06 → hoy 10 = 3 días perdidos, sólo 2 freezes
    const r = computeStreak(['2026-10-06'], today, 2);
    expect(r.currentStreak).toBe(0);
  });

  test('2 freezes cubren exactamente 2 días perdidos', () => {
    const r = computeStreak(['2026-10-07'], today, 2);
    expect(r.currentStreak).toBe(3);
  });

  test('hueco interno tapado por freeze restante', () => {
    // 06,07 + hueco 08 + 09,10 → tapa 1 con 1 freeze
    const r = computeStreak(['2026-10-06', '2026-10-07', '2026-10-09', '2026-10-10'], today, 1);
    expect(r.currentStreak).toBe(5);
  });

  test('default 0 no altera resultados V1', () => {
    const dates = ['2026-10-08', '2026-10-09', '2026-10-10'];
    expect(computeStreak(dates, today)).toEqual(computeStreak(dates, today, 0));
    expect(computeGlobalStreak(dates, today)).toEqual(computeGlobalStreak(dates, today, 0));
  });
});
