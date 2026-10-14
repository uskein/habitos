import {
  defaultReminderTime,
  parseReminderTime,
  planReminder,
} from '../reminderPlanner';

describe('reminderPlanner (M29 · recordatorios)', () => {
  describe('parseReminderTime', () => {
    it('acepta HH:mm válido', () => {
      expect(parseReminderTime('09:30')).toEqual({ hour: 9, minute: 30 });
      expect(parseReminderTime('00:00')).toEqual({ hour: 0, minute: 0 });
      expect(parseReminderTime('23:59')).toEqual({ hour: 23, minute: 59 });
    });

    it('rechaza formatos inválidos', () => {
      expect(parseReminderTime('9:30')).toBeNull();
      expect(parseReminderTime('09:3')).toBeNull();
      expect(parseReminderTime('09-30')).toBeNull();
      expect(parseReminderTime('24:00')).toBeNull();
      expect(parseReminderTime('09:60')).toBeNull();
      expect(parseReminderTime('')).toBeNull();
      expect(parseReminderTime(null)).toBeNull();
      expect(parseReminderTime(undefined)).toBeNull();
    });
  });

  describe('defaultReminderTime', () => {
    it('usa la hora por defecto del tramo', () => {
      expect(defaultReminderTime('morning')).toBe('09:00');
      expect(defaultReminderTime('afternoon')).toBe('15:00');
      expect(defaultReminderTime('evening')).toBe('21:00');
    });

    it('sin tramo cae a 09:00', () => {
      expect(defaultReminderTime(null)).toBe('09:00');
      expect(defaultReminderTime(undefined)).toBe('09:00');
    });
  });

  describe('planReminder', () => {
    it('usa la hora explícita del hábito', () => {
      expect(planReminder({ reminderTime: '21:15' })).toEqual({ hour: 21, minute: 15 });
    });

    it('null/ausente ⇒ sin recordatorio (opt-in explícito)', () => {
      expect(planReminder({ reminderTime: null })).toBeNull();
      expect(planReminder({})).toBeNull();
      expect(planReminder({ reminderTime: 'xx' })).toBeNull();
    });
  });
});
