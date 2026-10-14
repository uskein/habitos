import { localDateISO } from '@habitos/shared';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, radii, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import { useTodayEntry, useUpsertEntry } from '@/features/wellbeing/useWellbeing';
import { useToast } from '@/ui/feedback/Toast';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayInput } from '@/ui/primitives/ClayInput';

const MOODS = ['😞', '😟', '😐', '🙂', '😄'];
const ENERGY = ['1', '2', '3', '4', '5'];

/** Check-in diario — HU-11 (mood/energy 1–5 + nota), upsert por fecha (F9). */
export default function CheckInSheet() {
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
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    label: {
      fontFamily: fonts.body,
      fontWeight: '600',
      fontSize: 14,
      color: colors.text,
      marginTop: spacing.sm,
    },
    moodRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'space-between',
    },
    moodChip: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: radii.lg,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: 62,
    },
    moodChipOn: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceAlt,
    },
    moodEmoji: {
      fontSize: 26,
    },
    energyChip: {
      flex: 1,
      height: 48,
      borderRadius: radii.lg,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: 62,
    },
    energyChipOn: {
      borderColor: colors.secondary,
      backgroundColor: colors.secondarySoft,
    },
    energyText: {
      fontFamily: fonts.mono,
      fontWeight: '700',
      fontSize: 18,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    energyTextOn: {
      color: colors.secondary,
    },
    submit: {
      marginTop: spacing.lg,
    },
  }), [colors]);

  const toast = useToast();
  const today = localDateISO();
  const existing = useTodayEntry();
  const upsert = useUpsertEntry();

  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const moodValue = mood ?? existing.data?.mood ?? null;
  const energyValue = energy ?? existing.data?.energy ?? null;
  const noteValue = note || existing.data?.note || '';

  const submit = () => {
    if (!moodValue || !energyValue) {
      toast.show('Selecciona ánimo y energía', 'error');
      return;
    }
    upsert.mutate(
      { date: today, mood: moodValue, energy: energyValue, note: noteValue || undefined },
      {
        onSuccess: () => {
          toast.show('Check-in guardado ✨', 'success');
          router.back();
        },
        onError: (e) => toast.show(e instanceof Error ? e.message : 'No se pudo guardar', 'error'),
      },
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Check-in de hoy</Text>
      <Text style={styles.subtitle}>¿Cómo te sientes y qué energía tienes?</Text>

      <Text style={styles.label}>Ánimo</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m, idx) => {
          const value = idx + 1;
          const on = moodValue === value;
          return (
            <Pressable
              key={m}
              onPress={() => setMood(value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Ánimo ${value} de 5`}
              style={[styles.moodChip, on && styles.moodChipOn]}
            >
              <Text style={styles.moodEmoji}>{m}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Energía</Text>
      <View style={styles.moodRow}>
        {ENERGY.map((e, idx) => {
          const value = idx + 1;
          const on = energyValue === value;
          return (
            <Pressable
              key={e}
              onPress={() => setEnergy(value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Energía ${value} de 5`}
              style={[styles.energyChip, on && styles.energyChipOn]}
            >
              <Text style={[styles.energyText, on && styles.energyTextOn]}>{e}</Text>
            </Pressable>
          );
        })}
      </View>

      <ClayInput
        label="Nota (opcional)"
        placeholder="Algo que quieras recordar de este día…"
        value={note}
        onChangeText={setNote}
        maxLength={200}
        multiline
      />

      <ClayButton
        label="Guardar check-in"
        loading={upsert.isPending}
        disabled={upsert.isPending}
        onPress={submit}
        style={styles.submit}
      />
    </ScrollView>
  );
}
