import {
  CreateHabitInput,
  HABIT_CATEGORIES,
  HABIT_COLOR_TOKENS,
  type CreateHabitInputType,
} from '@habitos/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCreateHabit } from '@/features/habits/useHabits';
import { fonts, palette, spacing } from '@/core/theme/theme';
import { useToast } from '@/ui/feedback/Toast';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayInput } from '@/ui/primitives/ClayInput';
import { ChipsTabs } from '@/ui/navigation/ChipsTabs';

const ICONS = ['💧', '📚', '🏃', '🧘', '🥗', '🧹', '💊', '🛏️'];
const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const CATEGORY_LABELS = { bienestar: 'Bienestar', meta: 'Meta', habito: 'Hábito' } as const;

type Category = (typeof HABIT_CATEGORIES)[number];
type ColorToken = (typeof HABIT_COLOR_TOKENS)[number];

/** Bottom sheet crear hábito — HU-4, validación Zod previa a la BD (F7). */
export default function NewHabitSheet() {
  const toast = useToast();
  const create = useCreateHabit();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(ICONS[0]!);
  const [category, setCategory] = useState<Category>('habito');
  const [colorToken, setColorToken] = useState<ColorToken>('primary-soft');
  const [frequency, setFrequency] = useState<'daily' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

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

      <Text style={styles.label}>Color</Text>
      <View style={styles.chipWrap}>
        {HABIT_COLOR_TOKENS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setColorToken(t)}
            style={[styles.tokenChip, colorToken === t && styles.tokenChipOn]}
          >
            <Text style={[styles.tokenText, colorToken === t && styles.dayTextOn]}>{t}</Text>
          </Pressable>
        ))}
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

const styles = StyleSheet.create({
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
    color: palette.text,
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 14,
    color: palette.text,
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
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipOn: {
    borderColor: palette.primary,
    backgroundColor: palette.surfaceAlt,
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
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipOn: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  dayText: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 14,
    color: palette.textMuted,
  },
  dayTextOn: {
    color: palette.surface,
  },
  tokenChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  tokenChipOn: {
    borderColor: palette.primary,
    backgroundColor: palette.surfaceAlt,
  },
  tokenText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textMuted,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
