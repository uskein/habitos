import {
  challengeCurrentDay,
  challengePercent,
  isChallengeComplete,
  shareChallengeText,
} from '../challengeProgress';

describe('challengeProgress (M36 · retos)', () => {
  describe('challengeCurrentDay', () => {
    it('el día de inicio es el día 1', () => {
      expect(challengeCurrentDay('2026-10-01', '2026-10-01')).toBe(1);
    });

    it('avanza con el calendario (incluye cruzes de mes/año)', () => {
      expect(challengeCurrentDay('2026-10-01', '2026-10-31')).toBe(31);
      expect(challengeCurrentDay('2026-12-28', '2026-12-31')).toBe(4);
      expect(challengeCurrentDay('2026-12-31', '2027-01-02')).toBe(3);
    });

    it('fechas futuras al inicio se pispan a 1 (sin días negativos)', () => {
      expect(challengeCurrentDay('2026-10-10', '2026-10-01')).toBe(1);
    });
  });

  describe('challengePercent', () => {
    it('proporción redondeada, tope100', () => {
      expect(challengePercent(0, 30)).toBe(0);
      expect(challengePercent(15, 30)).toBe(50);
      expect(challengePercent(10, 30)).toBe(33);
      expect(challengePercent(30, 30)).toBe(100);
      expect(challengePercent(45, 30)).toBe(100);
    });

    it('duración inválida ⇒ 0', () => {
      expect(challengePercent(5, 0)).toBe(0);
      expect(challengePercent(5, -1)).toBe(0);
    });
  });

  describe('isChallengeComplete', () => {
    it('completo al alcanzar o superar la duración', () => {
      expect(isChallengeComplete(29, 30)).toBe(false);
      expect(isChallengeComplete(30, 30)).toBe(true);
      expect(isChallengeComplete(31, 30)).toBe(true);
    });
  });

  describe('shareChallengeText', () => {
    it('incluye nombre, hábito, día y porcentaje', () => {
      const text = shareChallengeText({
        name: '30 días de agua',
        habitName: 'Beber 2 L de agua',
        completedDays: 15,
        days: 30,
      });
      expect(text).toContain('30 días de agua');
      expect(text).toContain('Beber 2 L de agua');
      expect(text).toContain('15/30');
      expect(text).toContain('50%');
    });
  });
});
