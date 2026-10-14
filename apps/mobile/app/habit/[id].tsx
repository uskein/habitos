import { localDateISO } from '@habitos/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';
import {
  useArchiveHabit,
  useHabit,
  useHabitHistory,
  useToggleLog,
} from '@/features/habits/useHabits';
import { MilestoneSection } from '@/features/milestones/MilestoneSection';
import { useHabitStats } from '@/features/habits/useStats';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { ClayBars } from '@/ui/feedback/ClayBars';
import { ClaySparkline } from '@/ui/feedback/ClaySparkline';
import { HourlyChart } from '@/ui/feedback/HourlyChart';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { useToast } from '@/ui/feedback/Toast';
import { AppBar } from '@/ui/navigation/AppBar';
import { ChipsTabs } from '@/ui/navigation/ChipsTabs';
import { ClayButton } from '@/ui/primitives/ClayButton';

interface MonthCell {
  day: number;
  date: string;
  state: 'completed' | 'missed' | 'future' | 'off';
}

/** Detalle de hábito — HU-8 (historial) + archivar HU-7. */
export default function HabitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const habit = useHabit(id);
  const today = localDateISO();
  const history = useHabitHistory(id, today.slice(0, 8) + '01', today);
  const toggle = useToggleLog();
  const archive = useArchiveHabit();
  const [page, setPage] = useState(0);

  const monthCells = useMemo(() => buildMonth(today, page, history.data ?? []), [today, page, history.data]);

  if (habit.isPending || history.isPending) {
    return (
      <View style={styles.screen}>
        <AppBar title="Hábito" onBack={() => router.back()} />
        <View style={styles.body}>
          <Skeleton height={32} width="60%" />
          <Skeleton height={24} width="40%" />
          <Skeleton height={220} borderRadius={24} />
        </View>
      </View>
    );
  }

  if (habit.isError || !habit.data) {
    return (
      <View style={styles.screen}>
        <AppBar title="Hábito" onBack={() => router.back()} />
        <View style={styles.center}>
          <EmptyState title="Hábito no encontrado" blob="⚠" />
        </View>
      </View>
    );
  }

  const h = habit.data;
  const todayLog = history.data?.find((l) => l.logDate === today);
  const completedCount = (history.data ?? []).filter((l) => l.completed).length;
  const monthLabel = monthLabelFor(today, page);

  const onToggle = () => {
    toggle.mutate(
      { habitId: h.id, date: today },
      {
        onSuccess: (log) => {
          if (log.completed) {
            toast.show('¡Hábito completado! 🔥', 'success', {
              label: 'Deshacer',
              onPress: () =>
                toggle.mutate(
                  { habitId: h.id, date: today },
                  { onError: () => toast.show('No se pudo deshacer', 'error') },
                ),
            });
          }
        },
        onError: () => toast.show('No se pudo guardar', 'error'),
      },
    );
  };

  const onArchive = () => {
    Alert.alert('Archivar hábito', `«${h.name}» dejará de aparecer en Hoy.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Archivar',
        style: 'destructive',
        onPress: () =>
          archive.mutate(h.id, {
            onSuccess: () => {
              toast.show('Hábito archivado', 'success');
              router.back();
            },
            onError: () => toast.show('No se pudo archivar', 'error'),
          }),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <AppBar title={h.name} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Animated.View entering={FadeIn.duration(240)} style={styles.header}>
          <Text style={styles.icon}>{h.icon}</Text>
          <View style={styles.headerTexts}>
            <Text style={styles.title}>{h.name}</Text>
            <Text style={styles.meta}>
              {h.category} · {h.frequency === 'daily' ? 'todos los días' : `días ${JSON.stringify(h.customDays)}`} ·
              racha actual
            </Text>
          </View>
          <Pressable
            onPress={onToggle}
            disabled={toggle.isPending}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!todayLog?.completed }}
            style={[styles.check, todayLog?.completed && styles.checkOn]}
          >
            <Text style={[styles.checkGlyph, todayLog?.completed && styles.checkGlyphOn]}>✓</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.statsRow}>
          <Stat label="Completados" value={String(completedCount)} />
          <Stat label="Registro" value={String((history.data ?? []).length)} />
          <Stat label="Hoy" value={todayLog?.completed ? '✓' : '—'} />
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calHeader}>
            <Pressable onPress={() => setPage((p) => p - 1)} hitSlop={8} accessibilityLabel="Mes anterior">
              <Text style={styles.calNav}>‹</Text>
            </Pressable>
            <Text style={styles.calTitle}>{monthLabel}</Text>
            <Pressable
              onPress={() => setPage((p) => Math.min(0, p + 1))}
              hitSlop={8}
              accessibilityLabel="Mes siguiente"
              disabled={page >= 0}
            >
              <Text style={[styles.calNav, page >= 0 && styles.calNavOff]}>›</Text>
            </Pressable>
          </View>

          <View style={styles.calGrid}>
            {monthCells.map((c) => (
              <View
                key={c.date}
                style={[
                  styles.calCell,
                  c.state === 'completed' && styles.calCellDone,
                  c.state === 'missed' && styles.calCellMissed,
                  c.state === 'off' && styles.calCellOff,
                ]}
              >
                <Text
                  style={[
                    styles.calDay,
                    c.state === 'completed' && styles.calDayDone,
                    c.state === 'future' && styles.calDayFuture,
                    c.state === 'off' && styles.calDayOff,
                  ]}
                >
                  {c.day}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.legend}>
            <Legend color={palette.primary} label="Hecho" />
            <Legend color={palette.dangerSoft} label="Fallado" />
            <Legend color={palette.surfaceAlt} label="Libre" />
          </View>
        </View>

        {completedCount === 0 && (
          <EmptyState
            title="Sin historial aún"
            description="Marca el check de arriba para empezar tu racha."
            blob="◷"
          />
        )}

        <HabitStatsSection habitId={h.id} />

        <MilestoneSection entityType="habit" entityId={h.id} />

        <Pressable onPress={onArchive} disabled={archive.isPending} style={styles.archive}>
          <Text style={styles.archiveText}>Archivar hábito</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/** HU-26 · V2 — stats: tasa 30 d (ClayBars), hora (Victory) y tendencia (Sparkline).
 *  V2.1 · HU-30 — ChipsTabs de tramo filtra día/hora (sin tramo = sin filtro). */
const STAT_SLOTS = ['all', 'morning', 'afternoon', 'evening'] as const;
const STAT_SLOT_LABELS = {
  all: 'Todo el día',
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche',
} as const;

function HabitStatsSection({ habitId }: { habitId: string }) {
  const [slot, setSlot] = useState<(typeof STAT_SLOTS)[number]>('all');
  const stats = useHabitStats(habitId, slot === 'all' ? null : slot);

  if (stats.isPending) {
    return (
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Estadísticas</Text>
        <Skeleton height={200} borderRadius={24} />
      </View>
    );
  }

  if (stats.isError) {
    return (
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Estadísticas</Text>
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
    <View style={styles.statsSection}>
      <Text style={styles.statsTitle}>Estadísticas</Text>
      <ChipsTabs
        options={STAT_SLOTS}
        value={slot}
        onChange={setSlot}
        labels={STAT_SLOT_LABELS}
      />
      <View style={styles.statsCard}>
        <View style={styles.statsHeadRow}>
          <Text style={styles.statsLabel}>Tasa 30 días</Text>
          <Text style={styles.statsRate}>{s.rate30}%</Text>
        </View>
        <ClayBars
          data={s.daily30}
          height={120}
          barWidth={5}
          accessibilityLabel="Tasa de cumplimiento de los últimos 30 días"
        />
        <Text style={styles.statsLabel}>Distribución por hora</Text>
        <HourlyChart hourly={s.hourly} emptyLabel="Aún sin registros por hora" />
        <Text style={styles.statsLabel}>Tendencia (14 días)</Text>
        <ClaySparkline data={s.trend} height={48} accessibilityLabel="Tendencia de los últimos 14 días" />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function monthLabelFor(today: string, page: number): string {
  const d = new Date(today);
  d.setMonth(d.getMonth() + page);
  const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildMonth(today: string, page: number, logs: { logDate: string; completed: boolean }[]): MonthCell[] {
  const [y, m] = today.split('-').map(Number) as [number, number, number];
  const d = new Date(y, m - 1 + page, 1);
  const year = d.getFullYear();
  const month = d.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = d.getDay();
  const todayDate = new Date(today);
  const doneSet = new Set(logs.filter((l) => l.completed).map((l) => l.logDate));

  const cells: MonthCell[] = [];
  for (let i = 0; i < offset; i++) cells.push({ day: 0, date: `pad-${i}`, state: 'off' });

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cellDate = new Date(date);
    let state: MonthCell['state'] = 'missed';
    if (doneSet.has(date)) state = 'completed';
    else if (cellDate > todayDate) state = 'future';
    cells.push({ day, date, state });
  }
  return cells;
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
  },
  icon: {
    fontSize: 34,
  },
  headerTexts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 20,
    color: palette.text,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
    textTransform: 'capitalize',
  },
  check: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: palette.primary,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: palette.primary,
  },
  checkGlyph: {
    color: palette.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  checkGlyphOn: {
    color: palette.surface,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 22,
    color: palette.primary,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 2,
  },
  statsSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statsTitle: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 16,
    color: palette.text,
    marginLeft: 4,
  },
  statsCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  statsHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsLabel: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 12,
    color: palette.textMuted,
  },
  statsRate: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 20,
    color: palette.primary,
    fontVariant: ['tabular-nums'],
  },
  calendarCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calNav: {
    fontSize: 26,
    color: palette.primary,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  calNavOff: {
    color: palette.border,
  },
  calTitle: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 15,
    color: palette.text,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calCell: {
    width: '13.7%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCellDone: {
    backgroundColor: palette.primary,
  },
  calCellMissed: {
    backgroundColor: palette.dangerSoft,
  },
  calCellOff: {
    backgroundColor: 'transparent',
  },
  calDay: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  calDayDone: {
    color: palette.surface,
    fontWeight: '700',
  },
  calDayFuture: {
    color: palette.textMuted,
  },
  calDayOff: {
    color: 'transparent',
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
  },
  archive: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  archiveText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: palette.error,
    fontWeight: '600',
  },
});
