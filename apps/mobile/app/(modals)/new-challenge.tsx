import { CHALLENGE_DAYS, type CreateChallengeInputType } from '@habitos/shared';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme, type ActivePalette } from '@/core/theme/ThemeProvider';
import { fonts, spacing } from '@/core/theme/theme';
import { useCreateChallenge } from '@/features/challenges/useChallenges';
import { useHabitsActive } from '@/features/habits/useHabits';
import { useToast } from '@/ui/feedback/Toast';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayInput } from '@/ui/primitives/ClayInput';
import { ChipsTabs } from '@/ui/navigation/ChipsTabs';

/** ChipsTabs trabaja con strings; se mapea a número al enviar (Zod valida). */
const DAY_OPTIONS = ['7', '14', '30', '60', '90'] as const;
const DAY_LABELS: Record<string, string> = {
  '7': '7 días',
  '14': '14 días',
  '30': '30 días',
  '60': '60 días',
  '90': '90 días',
};

function makeStyles(colors: ActivePalette) {
  return StyleSheet.create({
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
    habitList: {
      gap: spacing.sm,
    },
    habitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    habitRowOn: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceAlt,
    },
    habitIcon: { fontSize: 20 },
    habitName: {
      flex: 1,
      fontFamily: fonts.body,
      fontWeight: '600',
      fontSize: 14,
      color: colors.text,
    },
    habitCheck: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    hint: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    submit: { marginTop: spacing.lg },
  });
}

/** Modal crear reto (M36): hábito + duración + nombre. */
export default function NewChallengeSheet() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const toast = useToast();
  const create = useCreateChallenge();
  const habits = useHabitsActive();

  const [habitId, setHabitId] = useState<string | null>(null);
  const [days, setDays] = useState<(typeof DAY_OPTIONS)[number]>('30');
  const [name, setName] = useState('');

  const daysNum = Number(days) as (typeof CHALLENGE_DAYS)[number];
  const effectiveName = name.trim() || `Reto de ${daysNum} días`;

  const submit = () => {
    if (!habitId) {
      toast.show('Elige un hábito para el reto', 'error');
      return;
    }
    const input: CreateChallengeInputType = { name: effectiveName, habitId, days: daysNum };
    create.mutate(input, {
      onSuccess: () => {
        toast.show(`«${effectiveName}» creado`, 'success');
        router.back();
      },
      onError: (e) =>
        toast.show(e instanceof Error ? e.message : 'No se pudo crear el reto', 'error'),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Nuevo reto</Text>

      <ClayInput
        label="Nombre (opcional)"
        placeholder={`Reto de ${daysNum} días`}
        value={name}
        onChangeText={setName}
        maxLength={60}
        helper={`${effectiveName.length}/60`}
      />

      <Text style={styles.label}>Duración</Text>
      <ChipsTabs
        options={DAY_OPTIONS}
        value={days}
        onChange={setDays}
        labels={DAY_LABELS}
      />

      <Text style={styles.label}>Hábito</Text>
      {habits.isPending ? (
        <Text style={styles.hint}>Cargando hábitos…</Text>
      ) : (habits.data ?? []).length === 0 ? (
        <Text style={styles.hint}>Crea primero un hábito para poder retarte.</Text>
      ) : (
        <View style={styles.habitList}>
          {(habits.data ?? []).map((h) => {
            const on = habitId === h.id;
            return (
              <Pressable
                key={h.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => setHabitId(h.id)}
                style={[styles.habitRow, on && styles.habitRowOn]}
              >
                <Text style={styles.habitIcon}>{h.icon}</Text>
                <Text style={styles.habitName} numberOfLines={1}>
                  {h.name}
                </Text>
                {on ? <Text style={styles.habitCheck}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      )}

      <ClayButton
        label="Crear reto"
        loading={create.isPending}
        disabled={create.isPending || !habitId}
        onPress={submit}
        style={styles.submit}
      />
    </ScrollView>
  );
}
