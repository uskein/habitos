import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';
import { useAddProgress, useGoal } from '@/features/goals/useGoals';
import { AppBar } from '@/ui/navigation/AppBar';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Progress } from '@/ui/feedback/Progress';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { useToast } from '@/ui/feedback/Toast';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayInput } from '@/ui/primitives/ClayInput';

const DELTAS = [1, 5, 10];

/** Detalle de meta — HU-10 / flujo F4 (registrar progreso con delta). */
export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const goal = useGoal(id);
  const add = useAddProgress(id);
  const [custom, setCustom] = useState('');
  const [note, setNote] = useState('');

  if (goal.isPending) {
    return (
      <View style={styles.screen}>
        <AppBar title="Meta" onBack={() => router.back()} />
        <View style={styles.body}>
          <Skeleton height={28} width="70%" />
          <Skeleton height={12} borderRadius={6} />
          <Skeleton height={120} borderRadius={24} />
        </View>
      </View>
    );
  }

  if (goal.isError || !goal.data) {
    return (
      <View style={styles.screen}>
        <AppBar title="Meta" onBack={() => router.back()} />
        <View style={styles.center}>
          <EmptyState title="Meta no encontrada" blob="⚠" />
        </View>
      </View>
    );
  }

  const g = goal.data;
  const pct = Math.min(1, g.currentValue / g.targetValue);
  const done = g.status !== 'active';

  const applyDelta = (delta: number) => {
    if (done) return;
    add.mutate(
      { delta, note: note.trim() || undefined },
      {
        onSuccess: (updated) => {
          toast.show(
            updated.status === 'completed'
              ? '¡Meta cumplida! 🎯'
              : `+${delta} ${updated.unit ?? ''} registrado`,
            'success',
          );
          setNote('');
          setCustom('');
        },
        onError: (e) => toast.show(e instanceof Error ? e.message : 'No se pudo guardar', 'error'),
      },
    );
  };

  return (
    <View style={styles.screen}>
      <AppBar title="Meta" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{g.title}</Text>
        <Text style={styles.numbers}>
          <Text style={styles.value}>{g.currentValue}</Text>
          <Text style={styles.target}>
            {' '}
            / {g.targetValue} {g.unit ?? ''}
          </Text>
        </Text>
        <Progress progress={pct} color={done ? palette.success : palette.primary} />
        <Text style={styles.pctLabel}>{Math.round(pct * 100)}% completado</Text>

        {!done && (
          <View style={styles.actions}>
            <Text style={styles.section}>Registrar progreso</Text>
            <View style={styles.deltaRow}>
              {DELTAS.map((d) => (
                <ClayButton
                  key={d}
                  label={`+${d}`}
                  variant="secondary"
                  loading={add.isPending}
                  onPress={() => applyDelta(d)}
                />
              ))}
            </View>
            <ClayInput
              label="Otro monto"
              placeholder="Ej. 7"
              value={custom}
              onChangeText={setCustom}
              keyboardType="numeric"
              onSubmitEditing={() => {
                const n = Number(custom.replace(',', '.'));
                if (Number.isFinite(n) && n !== 0) applyDelta(Math.trunc(n));
              }}
              helper="Escribe y pulsaIntro"
            />
            <ClayInput
              label="Nota (opcional)"
              placeholder="¿Cómo fue?"
              value={note}
              onChangeText={setNote}
              maxLength={120}
            />
          </View>
        )}

        {g.status === 'completed' && (
          <View style={styles.doneBox}>
            <Text style={styles.doneText}>🎉 Meta cumplida</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 24,
    color: palette.text,
  },
  numbers: {
    fontFamily: fonts.body,
    fontSize: 16,
  },
  value: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 34,
    color: palette.primary,
    fontVariant: ['tabular-nums'],
  },
  target: {
    color: palette.textMuted,
  },
  pctLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textMuted,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  section: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 16,
    color: palette.text,
  },
  deltaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  doneBox: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  doneText: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 16,
    color: palette.primary,
  },
});
