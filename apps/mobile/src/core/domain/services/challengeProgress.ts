/**
 * Progreso de retos (M36 · dominio puro, testeable sin BD).
 * Reglas: el reto avanza por día calendario; se completa al alcanzar `days`
 * check-ins (no hace falta racha perfecta, pero el % avanza con ellos).
 */

/** Día calendario del reto (1 = hoy es el primer día). */
export function challengeCurrentDay(startDate: string, todayISO: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ty, tm, td] = todayISO.split('-').map(Number);
  const start = new Date(sy!, (sm ?? 1) - 1, sd ?? 1);
  const today = new Date(ty!, (tm ?? 1) - 1, td ?? 1);
  const diff = Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(1, diff);
}

/** % de avance (0–100) — completedDays sobre la duración del reto. */
export function challengePercent(completedDays: number, totalDays: number): number {
  if (totalDays <= 0) return 0;
  return Math.min(100, Math.round((completedDays / totalDays) * 100));
}

/** true si el reto ya alcanzó sus días completados. */
export function isChallengeComplete(completedDays: number, totalDays: number): boolean {
  return completedDays >= totalDays;
}

/** Texto plano para compartir el progreso (Share sheet). */
export function shareChallengeText(input: {
  name: string;
  habitName: string;
  completedDays: number;
  days: number;
}): string {
  const pct = challengePercent(input.completedDays, input.days);
  return (
    `🏆 Reto «${input.name}» — ${input.habitName}\n` +
    `Día ${input.completedDays}/${input.days} · ${pct}% completado\n` +
    `Sigue así con Hábitos 💜`
  );
}
