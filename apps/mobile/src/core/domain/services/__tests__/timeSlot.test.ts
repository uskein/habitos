import { hourInSlot, TIME_SLOT_HOURS } from '@habitos/shared';

describe('hourInSlot — HU-30 (V2.1)', () => {
  test('mañana: 5–11', () => {
    expect(hourInSlot(5, 'morning')).toBe(true);
    expect(hourInSlot(11, 'morning')).toBe(true);
    expect(hourInSlot(4, 'morning')).toBe(false);
    expect(hourInSlot(12, 'morning')).toBe(false);
  });

  test('tarde: 12–19', () => {
    expect(hourInSlot(12, 'afternoon')).toBe(true);
    expect(hourInSlot(19, 'afternoon')).toBe(true);
    expect(hourInSlot(20, 'afternoon')).toBe(false);
    expect(hourInSlot(11, 'afternoon')).toBe(false);
  });

  test('noche: wrap 20–4 (incluye madrugada)', () => {
    expect(hourInSlot(20, 'evening')).toBe(true);
    expect(hourInSlot(23, 'evening')).toBe(true);
    expect(hourInSlot(0, 'evening')).toBe(true);
    expect(hourInSlot(4, 'evening')).toBe(true);
    expect(hourInSlot(5, 'evening')).toBe(false);
    expect(hourInSlot(12, 'evening')).toBe(false);
  });

  test('los tramos cubren las 24 horas sin solaparse', () => {
    for (let h = 0; h < 24; h++) {
      const hits = Object.keys(TIME_SLOT_HOURS).filter((s) =>
        hourInSlot(h, s as keyof typeof TIME_SLOT_HOURS),
      );
      expect(hits).toHaveLength(1);
    }
  });
});
