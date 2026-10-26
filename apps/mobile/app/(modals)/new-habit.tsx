import {
  CreateHabitInput,
  HABIT_CATEGORIES,
  HABIT_COLOR_TOKENS,
  TIME_SLOTS,
  type CreateHabitInputType,
  type TimeSlot,
} from '@habitos/shared';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { defaultReminderTime } from '@/core/domain/services/reminderPlanner';
import { ensurePermissionAsync } from '@/core/services/notificationService';
import { useCreateHabit } from '@/features/habits/useHabits';
import { fonts, habitSwatches, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import { useToast } from '@/ui/feedback/Toast';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayInput } from '@/ui/primitives/ClayInput';
import { ClayToggle } from '@/ui/primitives/ClayToggle';
import { ChipsTabs } from '@/ui/navigation/ChipsTabs';

const ICONS = ['💧', '📚', '🏃', '🧘', '🥗', '🧹', '💊', '🛏️'];
const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const CATEGORY_LABELS = { bienestar: 'Bienestar', meta: 'Meta', habito: 'Hábito' } as const;
const SLOT_OPTIONS = ['none', ...TIME_SLOTS] as const;
const SLOT_LABELS = {
  none: 'Sin tramo',
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche',
} as const;
/** V5 · M42 — meta semanal: días/semana objetivo (opcional). */
const WEEK_TARGETS = ['none', '1', '2', '3', '4', '5', '6', '7'] as const;
type WeekTarget = (typeof WEEK_TARGETS)[number];
const WEEK_TARGET_LABELS: Partial<Record<WeekTarget, string>> = {
  none: 'Sin meta',
  '1': '1 día',
  '2': '2 días',
  '3': '3 días',
  '4': '4 días',
  '5': '5 días',
  '6': '6 días',
  '7': '7 días',
};

type Category = (typeof HABIT_CATEGORIES)[number];
type ColorToken = (typeof HABIT_COLOR_TOKENS)[number];

/** Bottom sheet crear hábito — HU-4, validación Zod previa a la BD (F7). */
export default function NewHabitSheet() {
  const { colors } = useAppTheme();

  const styles = useMemo(() => StyleSheet.create({
    body: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: 48,
      paddingTop: spacing.sm,
    },
    title: {
      fontFamily: fonts.display,
      fontWeight: '700',
      fontSize: 22,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    label: {
      fontFamily: fonts.body,
      fontWeight: '600',
      fontSize: 14,
      color: colors.text,
      marginTop: spacing.sm,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    iconChip: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconChipOn: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceAlt,
    },
    iconGlyph: {
      fontSize: 22,
    },
    daysRow: {
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'space-between',
    },
    dayChip: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayChipOn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dayText: {
      fontFamily: fonts.body,
      fontWeight: '600',
      fontSize: 14,
      color: colors.textMuted,
    },
    dayTextOn: {
      color: colors.surface,
    },
    swatchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    swatchCol: {
      alignItems: 'center',
      gap: 6,
    },
    swatch: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchOn: {
      borderColor: colors.primary,
      borderWidth: 3,
    },
    swatchCheck: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    swatchName: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.textMuted,
    },
    swatchNameOn: {
      color: colors.primary,
      fontWeight: '600',
    },
    reminderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    timeBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    timeBtnOff: {
      opacity: 0.5,
    },
    timeText: {
      fontFamily: fonts.mono,
      fontWeight: '600',
      fontSize: 15,
      color: colors.text,
    },
    timeTextOff: {
      color: colors.textMuted,
    },
    reminderHint: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
    },
    submit: {
      marginTop: spacing.lg,
    },
  }), [colors]);

  const toast = useToast();
  const create = useCreateHabit();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(ICONS[0]!);
  const [category, setCategory] = useState<Category>('habito');
  const [colorToken, setColorToken] = useState<ColorToken>('primary-soft');
  const [frequency, setFrequency] = useState<'daily' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]);
  const [weekTarget, setWeekTarget] = useState<WeekTarget>('none');
  const [slot, setSlot] = useState<(typeof SLOT_OPTIONS)[number]>('none');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [timeTouched, setTimeTouched] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const nameError =
    touched && (name.trim().length === 0 || name.trim().length > 60)
      ? 'El nombre debe tener 1–60 caracteres'
      : undefined;

  const buildInput = (): CreateHabitInputType => ({
    name: name.trim(),
    icon,
    category,
    colorToken,
    frequency,
    customDays: frequency === 'custom' ? customDays : undefined,
    timeSlot: (slot === 'none' ? undefined : slot) as TimeSlot | undefined,
    reminderTime: reminderOn ? reminderTime : null,
    weeklyTarget: weekTarget === 'none' ? null : Number(weekTarget),
  });

  const submit = async () => {
    setTouched(true);
    const parsed = CreateHabitInput.safeParse(buildInput());
    if (!parsed.success) {
      toast.show('Revisa los campos del formulario', 'error');
      return;
    }
    setBusy(true);
    try {
      await create.mutateAsync(parsed.data);
      toast.show(`«${parsed.data.name}» creado`, 'success');
      router.back();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'No se pudo crear', 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleDay = (d: number) =>
    setCustomDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  /** Cambio de tramo: prellena la hora del recordatorio (si no se editó a mano). */
  const changeSlot = (v: (typeof SLOT_OPTIONS)[number]) => {
    setSlot(v);
    if (!timeTouched) {
      setReminderTime(defaultReminderTime(v === 'none' ? null : v));
      setReminderOn(v !== 'none');
    }
  };

  /** Activar recordatorio pide el permiso (Android 13+) antes de encender. */
  const changeReminder = (v: boolean) => {
    if (!v) {
      setReminderOn(false);
      return;
    }
    void (async () => {
      const ok = await ensurePermissionAsync();
      if (ok) setReminderOn(true);
      else toast.show('Permite los permisos de notificaciones', 'error');
    })();
  };

  const onTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      setReminderTime(`${hh}:${mm}`);
      setTimeTouched(true);
    }
  };

  const reminderDate = (): Date => {
    const d = new Date();
    const [h, m] = reminderTime.split(':').map(Number);
    d.setHours(h ?? 9, m ?? 0, 0, 0);
    return d;
  };

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Nuevo hábito</Text>

      <ClayInput
        label="Nombre"
        placeholder="Ej. Beber 2 L de agua"
        value={name}
        onChangeText={setName}
        onBlur={() => setTouched(true)}
        maxLength={60}
        error={nameError}
        helper={`${name.trim().length}/60`}
      />

      <Text style={styles.label}>Icono</Text>
      <View style={styles.chipWrap}>
        {ICONS.map((i) => (
          <Pressable
            key={i}
            onPress={() => setIcon(i)}
            accessibilityRole="button"
            accessibilityLabel={`Icono ${i}`}
            style={[styles.iconChip, icon === i && styles.iconChipOn]}
          >
            <Text style={styles.iconGlyph}>{i}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Categoría</Text>
      <ChipsTabs
        options={HABIT_CATEGORIES}
        value={category}
        onChange={setCategory}
        labels={CATEGORY_LABELS}
      />

      <Text style={styles.label}>Frecuencia</Text>
      <ChipsTabs
        options={['daily', 'custom'] as const}
        value={frequency}
        onChange={setFrequency}
        labels={{ daily: 'Todos los días', custom: 'Días personalizados' }}
      />
      <Text style={styles.label}>Tramo (opcional)</Text>
      <ChipsTabs options={SLOT_OPTIONS} value={slot} onChange={changeSlot} labels={SLOT_LABELS} />
      {frequency === 'custom' && (
        <View style={styles.daysRow}>
          {DAYS.map((d, idx) => (
            <Pressable
              key={d}
              onPress={() => toggleDay(idx)}
              style={[styles.dayChip, customDays.includes(idx) && styles.dayChipOn]}
            >
              <Text style={[styles.dayText, customDays.includes(idx) && styles.dayTextOn]}>{d}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* V5 · M42 — meta semanal opcional */}
      <Text style={styles.label}>Meta semanal (opcional)</Text>
      <ChipsTabs
        options={WEEK_TARGETS}
        value={weekTarget}
        onChange={setWeekTarget}
        labels={WEEK_TARGET_LABELS}
      />
      <Text style={styles.reminderHint}>
        Días por semana que quieres completarlo — se muestra como chip 🎯 en tus hábitos
      </Text>

      <Text style={styles.label}>Recordatorio</Text>
      <View style={styles.reminderRow}>
        <ClayToggle value={reminderOn} onValueChange={changeReminder} testID="reminder-toggle" />
        <Pressable
          disabled={!reminderOn}
          onPress={() => setShowTimePicker(true)}
          accessibilityRole="button"
          accessibilityLabel={`Hora del recordatorio ${reminderTime}`}
          style={[styles.timeBtn, !reminderOn && styles.timeBtnOff]}
        >
          <Text style={[styles.timeText, !reminderOn && styles.timeTextOff]}>🕐 {reminderTime}</Text>
        </Pressable>
        <Text style={styles.reminderHint}>Avisos diarios</Text>
      </View>
      {showTimePicker && (
        <DateTimePicker value={reminderDate()} mode="time" display="default" onChange={onTimeChange} />
      )}

      <Text style={styles.label}>Color</Text>
      <View style={styles.swatchRow}>
        {HABIT_COLOR_TOKENS.map((t) => {
          const on = colorToken === t;
          return (
            <Pressable
              key={t}
              onPress={() => setColorToken(t)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Color ${t}`}
              style={styles.swatchCol}
            >
              <View style={[styles.swatch, on && styles.swatchOn, { backgroundColor: habitSwatches[t] }]}>
                {on ? <Text style={styles.swatchCheck}>✓</Text> : null}
              </View>
              <Text style={[styles.swatchName, on && styles.swatchNameOn]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <ClayButton
        label="Crear hábito"
        loading={busy}
        disabled={busy || name.trim().length === 0}
        onPress={submit}
        style={styles.submit}
      />
    </ScrollView>
  );
}
