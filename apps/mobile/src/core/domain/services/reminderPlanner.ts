import { type TimeSlot } from '@habitos/shared';

/** Horas por defecto de recordatorio según tramo (M29 · recordatorios por hábito). */
const SLOT_DEFAULT_TIMES: Record<TimeSlot, string> = {
  morning: '09:00',
  afternoon: '15:00',
  evening: '21:00',
};

export interface ReminderPlan {
  hour: number;
  minute: number;
}

/** Hora al activar recordatorio: gana el tramo; sin tramo → 09:00. */
export function defaultReminderTime(slot?: TimeSlot | null): string {
  return slot ? SLOT_DEFAULT_TIMES[slot] : '09:00';
}

/** Valida "HH:mm" → { hour, minute } (0–23 / 0–59); inválido → null. */
export function parseReminderTime(time?: string | null): ReminderPlan | null {
  if (!time) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

/**
 * Recordatorio a programar de un hábito (M29).
 * `reminderTime` es la única fuente de verdad: null = sin recordatorio.
 */
export function planReminder(habit: { reminderTime?: string | null }): ReminderPlan | null {
  return parseReminderTime(habit.reminderTime);
}
