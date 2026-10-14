import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, radii, spacing } from '@/core/theme/theme';
import { useAppTheme, type ActivePalette } from '@/core/theme/ThemeProvider';
import { useAddProgress, useGoal, useGoalStats, useGoalUpdates, useUpdateGoalNote } from '@/features/goals/useGoals';
import { MilestoneSection } from '@/features/milestones/MilestoneSection';
import { AppBar } from '@/ui/navigation/AppBar';
import { ClayBars } from '@/ui/feedback/ClayBars';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { HourlyChart } from '@/ui/feedback/HourlyChart';
import { Progress } from '@/ui/feedback/Progress';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { useToast } from '@/ui/feedback/Toast';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayCard } from '@/ui/primitives/ClayCard';
import { ClayInput } from '@/ui/primitives/ClayInput';

const DELTAS = [1, 5, 10];

/** Estilos dependientes de la paleta activa — se recalculan por tema. */
const makeStyles = (colors: ActivePalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
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
      color: colors.text,
    },
    numbers: {
      fontFamily: fonts.body,
      fontSize: 16,
    },
    value: {
      fontFamily: fonts.mono,
      fontWeight: '700',
      fontSize: 34,
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    target: {
      color: colors.textMuted,
    },
    pctLabel: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    blockTitle: {
      fontFamily: fonts.display,
      fontWeight: '700',
      fontSize: 16,
      color: colors.text,
    },
    sectionWrap: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    updateCard: {
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    updateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    updateDelta: {
      fontFamily: fonts.mono,
      fontWeight: '700',
      fontSize: 18,
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    updateDate: {
      flex: 1,
      fontFamily: fonts.mono,
      fontSize: 12,
      color: colors.textMuted,
    },
    updateNote: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.text,
    },
    updateNoteEmpty: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    noteEditRow: {
      gap: spacing.sm,
    },
    statsCard: {
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    statsLabel: {
      fontFamily: fonts.body,
      fontWeight: '600',
      fontSize: 12,
      color: colors.textMuted,
    },
    hourlyWrap: {
      gap: spacing.sm,
    },
    peak: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
    peakValue: {
      fontFamily: fonts.mono,
      fontWeight: '700',
      fontSize: 15,
      color: colors.primary,
    },
    chartBox: {
      height: 160,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.md,
      paddingVertical: spacing.sm,
    },
    deltaRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    doneBox: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.lg,
      padding: spacing.lg,
      alignItems: 'center',
    },
    doneText: {
      fontFamily: fonts.body,
      fontWeight: '600',
      fontSize: 16,
      color: colors.primary,
    },
  });

/** Detalle de meta — HU-10 / flujo F4 (registrar progreso con delta). */
export default function GoalDetail() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
        <Progress progress={pct} color={done ? colors.success : colors.primary} />
        <Text style={styles.pctLabel}>{Math.round(pct * 100)}% completado</Text>

        {!done && (
          <View style={styles.actions}>
            <Text style={styles.blockTitle}>Registrar progreso</Text>
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

        <GoalHistory goalId={g.id} />
        <GoalStatsSection goalId={g.id} unit={g.unit} />

        <MilestoneSection entityType="goal" entityId={g.id} />
      </ScrollView>
    </View>
  );
}

/** HU-19 — historial de progresos con edición de notas (tx GOAL_UPDATE). */
function GoalHistory({ goalId }: { goalId: string }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const toast = useToast();
  const updates = useGoalUpdates(goalId);
  const editNote = useUpdateGoalNote();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.blockTitle}>Historial y notas</Text>
      {updates.isPending ? (
        <Skeleton height={72} borderRadius={20} />
      ) : updates.isError ? (
        <ClayButton label="Reintentar" variant="secondary" onPress={() => void updates.refetch()} />
      ) : (updates.data ?? []).length === 0 ? (
        <EmptyState title="Aún sin registros" description="Registra tu primer progreso arriba." blob="◷" />
      ) : (
        (updates.data ?? []).map((u) => (
          <ClayCard key={u.id} style={styles.updateCard}>
            <View style={styles.updateHeader}>
              <Text style={styles.updateDelta}>+{u.delta}</Text>
              <Text style={styles.updateDate}>{u.entryDate}</Text>
              <ClayButton
                label={editingId === u.id ? 'Cerrar' : 'Editar nota'}
                variant="ghost"
                onPress={() => {
                  if (editingId === u.id) {
                    setEditingId(null);
                  } else {
                    setEditingId(u.id);
                    setDraft(u.note ?? '');
                  }
                }}
              />
            </View>
            {editingId === u.id ? (
              <View style={styles.noteEditRow}>
                <ClayInput
                  label="Nota"
                  placeholder="¿Cómo fue ese avance?"
                  value={draft}
                  onChangeText={setDraft}
                  maxLength={120}
                />
                <ClayButton
                  label="Guardar"
                  loading={editNote.isPending}
                  disabled={editNote.isPending}
                  onPress={() =>
                    editNote.mutate(
                      { updateId: u.id, note: draft },
                      {
                        onSuccess: () => {
                          setEditingId(null);
                          toast.show('Nota guardada', 'success');
                        },
                        onError: (e) =>
                          toast.show(e instanceof Error ? e.message : 'No se pudo guardar', 'error'),
                      },
                    )
                  }
                />
              </View>
            ) : u.note ? (
              <Text style={styles.updateNote}>{u.note}</Text>
            ) : (
              <Text style={styles.updateNoteEmpty}>Sin nota</Text>
            )}
          </ClayCard>
        ))
      )}
    </View>
  );
}

/** HU-20 · R9 — stats día/hora de meta: ClayBars 7 días + Victory hora pico. */
function GoalStatsSection({ goalId, unit }: { goalId: string; unit: string | null }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const stats = useGoalStats(goalId);

  if (stats.isPending) {
    return (
      <View style={styles.sectionWrap}>
        <Text style={styles.blockTitle}>Estadísticas</Text>
        <Skeleton height={180} borderRadius={24} />
      </View>
    );
  }

  if (stats.isError) {
    return (
      <View style={styles.sectionWrap}>
        <Text style={styles.blockTitle}>Estadísticas</Text>
        <EmptyState
          title="No se pudieron calcular las stats"
          blob="⚠"
          action={<ClayButton label="Reintentar" onPress={() => void stats.refetch()} />}
        />
      </View>
    );
  }

  const s = stats.data!;

  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.blockTitle}>Estadísticas</Text>
      {s.updates === 0 ? (
        <EmptyState
          title="Aún no hay datos"
          description="Registra progreso para ver el cumplimiento por día y tu hora pico."
          blob="◷"
        />
      ) : (
        <ClayCard style={styles.statsCard}>
          <Text style={styles.statsLabel}>Últimos 7 días ({unit ?? 'avances'})</Text>
          <ClayBars
            data={s.daily.map((d) => ({ label: d.label, value: d.total }))}
            height={140}
            accessibilityLabel="Cumplimiento por día de los últimos 7 días"
          />
          <Text style={styles.statsLabel}>Hora pico</Text>
          <HourlyChart hourly={s.hourly} />
        </ClayCard>
      )}
    </View>
  );
}
