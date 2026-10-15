import * as Notifications from 'expo-notifications';
import { localDateISO } from '@habitos/shared';
import { router } from 'expo-router';
import { planReminder } from '@/core/domain/services/reminderPlanner';
import { habitRepository } from '@/core/repositories/habitRepository';
import { prefs, PrefKeys } from '@/core/storage/preferences';
import { palette } from '@/core/theme/theme';

/** Canal Android de recordatorios (debe existir antes del prompt en Android 13+). */
export const REMINDER_CHANNEL_ID = 'recordatorios';

/** M41 · hora del recordatorio de cierre («¿Hiciste X hoy?»). */
export const EVENING_HOUR = 21;

/** Categoría de notificación con acciones rápidas (Hecho / Mañana). */
export const EVENING_CATEGORY = 'evening';

/** Mínimo que necesita el planner — `Habit` lo satisface. */
interface ReminderHabit {
  id: string;
  name: string;
  icon: string;
  reminderTime: string | null;
}

async function ensureChannelAsync(): Promise<void> {
  try {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Recordatorios de hábitos',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: palette.primary,
    });
  } catch {
    /* best-effort: sin canal el SO sigue mostrando con config por defecto */
  }
}

/** Permiso POST_NOTIFICATIONS (Android 13+): crea canal y pide si falta. */
export async function ensurePermissionAsync(): Promise<boolean> {
  try {
    await ensureChannelAsync();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

function readIdMap(): Record<string, string> {
  try {
    return JSON.parse(prefs.getString(PrefKeys.reminderIds) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function writeIdMap(map: Record<string, string>): void {
  prefs.set(PrefKeys.reminderIds, JSON.stringify(map));
}

function readEveningMap(): Record<string, string> {
  try {
    return JSON.parse(prefs.getString(PrefKeys.eveningIds) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function writeEveningMap(map: Record<string, string>): void {
  prefs.set(PrefKeys.eveningIds, JSON.stringify(map));
}

/** Interruptor maestro (Perfil). ON → reprograma todo; OFF → cancela todo. */
export function remindersEnabled(): boolean {
  return prefs.getBoolean(PrefKeys.notificationsEnabled) ?? true;
}

export async function cancelHabitReminder(habitId: string): Promise<void> {
  const map = readIdMap();
  const scheduledId = map[habitId];
  if (!scheduledId) return;
  delete map[habitId];
  writeIdMap(map);
  try {
    await Notifications.cancelScheduledNotificationAsync(scheduledId);
  } catch {
    /* ya caducada */
  }
}

async function cancelAllTracked(): Promise<void> {
  const map = readIdMap();
  writeIdMap({});
  await Promise.all(
    Object.values(map).map(async (scheduledId) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(scheduledId);
      } catch {
        /* id caducado */
      }
    }),
  );
}

/** Programa (o limpia) el recordatorio diario de un hábito. */
export async function syncHabitReminder(habit: ReminderHabit): Promise<void> {
  try {
    const plan = planReminder(habit);
    if (!remindersEnabled() || !plan) {
      await cancelHabitReminder(habit.id);
      return;
    }
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted) return; // sin permiso: lo recoge syncAll al otorgarse
    await ensureChannelAsync();
    await cancelHabitReminder(habit.id); // id previo, si lo había
    const scheduledId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio de hábitos',
        body: `${habit.icon} ¡Es tu momento: ${habit.name}!`,
        data: { habitId: habit.id },
        color: palette.primary,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: plan.hour,
        minute: plan.minute,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
    const map = readIdMap();
    map[habit.id] = scheduledId;
    writeIdMap(map);
  } catch {
    /* best-effort */
  }
}

/** Resincroniza todos los hábitos activos (inicio de app / master switch). */
export async function syncAllReminders(): Promise<void> {
  try {
    if (!remindersEnabled()) {
      await cancelAllTracked();
      return;
    }
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted) return;
    await ensureChannelAsync();
    const habits = await habitRepository.listActive();
    const map = readIdMap();
    const activeIds = new Set(habits.map((h) => h.id));
    for (const staleId of Object.keys(map)) {
      if (!activeIds.has(staleId)) {
        const orphanId = map[staleId];
        delete map[staleId];
        try {
          await Notifications.cancelScheduledNotificationAsync(orphanId!);
        } catch {
          /* id caducado */
        }
      }
    }
    writeIdMap(map);
    for (const habit of habits) {
      await syncHabitReminder(habit);
    }
    // M41 · el cierre del día se resincroniza junto a los recordatorios.
    await syncEveningReminders();
  } catch {
    /* best-effort */
  }
}

export async function setRemindersEnabled(enabled: boolean): Promise<void> {
  prefs.set(PrefKeys.notificationsEnabled, enabled);
  if (enabled) {
    await syncAllReminders();
  } else {
    await cancelAllTracked();
    await cancelAllEvening();
  }
}

/** M41 · registra la categoría con acciones rápidas Hecho/Mañana. */
export const EVENING_ACTION_DONE = 'DONE_HABIT';
export const EVENING_ACTION_SNOOZE = 'SNOOZE_TOMORROW';

async function registerEveningCategory(): Promise<void> {
  try {
    await Notifications.setNotificationCategoryAsync(EVENING_CATEGORY, [
      { identifier: EVENING_ACTION_DONE, buttonTitle: '✅ Hecho' },
      { identifier: EVENING_ACTION_SNOOZE, buttonTitle: '📅 Mañana' },
    ]);
  } catch {
    /* best-effort */
  }
}

async function cancelAllEvening(): Promise<void> {
  const map = readEveningMap();
  writeEveningMap({});
  await Promise.all(
    Object.values(map).map(async (scheduledId) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(scheduledId);
      } catch {
        /* id caducado */
      }
    }),
  );
}

/**
 * M41 · recordatorio de cierre — por cada hábito PENDIENTE de hoy programa
 * una notificación diaria a las 21:00 con acciones «Hecho» y «Mañana».
 * Se resincroniza en cada toggle (al completar desaparece; al deshacer vuelve).
 */
export async function syncEveningReminders(): Promise<void> {
  try {
    await cancelAllEvening();
    if (!remindersEnabled()) return;
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted) return;
    await ensureChannelAsync();
    await registerEveningCategory();

    const today = localDateISO();
    const habits = await habitRepository.listByDate(today);
    const pending = habits.filter((h) => !h.log?.completed);

    const newMap: Record<string, string> = {};
    for (const h of pending) {
      const scheduledId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '¿Cerraste tu día?',
          body: `${h.icon} ${h.name} — aún pendiente`,
          data: { habitId: h.id, evening: true },
          categoryIdentifier: EVENING_CATEGORY,
          color: palette.primary,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: EVENING_HOUR,
          minute: 0,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
      newMap[h.id] = scheduledId;
    }
    writeEveningMap(newMap);
  } catch {
    /* best-effort */
  }
}

/** M41 · marca un hábito como hecho desde la acción rápida de la notificación. */
async function completeHabitFromAction(habitId: string): Promise<void> {
  try {
    const today = localDateISO();
    const habits = await habitRepository.listByDate(today);
    const habit = habits.find((x) => x.id === habitId);
    if (habit && !habit.log?.completed) {
      await habitRepository.toggleLog(habitId, today);
    }
  } catch {
    /* best-effort */
  }
  void syncEveningReminders();
}

/**
 * Arranque (M29): handler de foreground, resync de recordatorios y navegación
 * al tocar la notificación (→ detalle del hábito). Devuelve la limpieza.
 */
export function initNotifications(): () => void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  void syncAllReminders();
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const habitId = response.notification.request.content.data?.habitId;
    const action = response.actionIdentifier;

    // M41 · acciones rápidas del cierre del día.
    if (action === EVENING_ACTION_DONE && typeof habitId === 'string') {
      void completeHabitFromAction(habitId);
      return;
    }
    if (action === EVENING_ACTION_SNOOZE) {
      // El trigger diario se repite mañana solo — no hacer nada.
      return;
    }
    // Tap normal → detalle del hábito (recordatorio o cierre).
    if (typeof habitId === 'string') {
      router.push({ pathname: '/habit/[id]', params: { id: habitId } });
    }
  });
  return () => responseSub.remove();
}
