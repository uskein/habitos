import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { localDateISO } from '@habitos/shared';
import { fonts, palette, spacing } from '@/core/theme/theme';
import { useAchievements, useRemoveCustomAchievement } from '@/features/achievements/useAchievements';
import { AchievementCard } from '@/features/achievements/AchievementCard';
import { useMonthCompletedDates, useYearHeatmap } from '@/features/achievements/useMonthStats';
import { YearHeatmap } from '@/features/achievements/YearHeatmap';
import { useGlobalStreak } from '@/features/habits/useHabits';
import { useFreezes, useToggleFreeze } from '@/features/habits/useFreezes';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { useToast } from '@/ui/feedback/Toast';
import { ChipsTabs } from '@/ui/navigation/ChipsTabs';
import { ClayButton } from '@/ui/primitives/ClayButton';

const VIEWS = ['all', 'mine'] as const;
const VIEW_LABELS = { all: 'Todas', mine: 'Mis logros' } as const;

/** Tab Logros — HU-12/HU-13: racha, nivel, calendario del mes y medallas + V2 HU-21/23. */
export default function AchievementsScreen() {
  const toast = useToast();
  const streak = useGlobalStreak();
  const achievements = useAchievements();
  const removeCustom = useRemoveCustomAchievement();
  const freezes = useFreezes();
  const toggleFreeze = useToggleFreeze();
  const [view, setView] = useState<(typeof VIEWS)[number]>('all');
  const now = new Date();
  const month = useMonthCompletedDates(now.getFullYear(), now.getMonth());
  const heatmap = useYearHeatmap();

  if (streak.isPending || achievements.isPending) {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Skeleton height={110} borderRadius={24} />
          <Skeleton height={40} borderRadius={16} />
          <View style={styles.grid}>
            <Skeleton height={150} style={styles.gridCell} />
            <Skeleton height={150} style={styles.gridCell} />
            <Skeleton height={150} style={styles.gridCell} />
            <Skeleton height={150} style={styles.gridCell} />
          </View>
        </View>
      </View>
    );
  }

  if (streak.isError || achievements.isError) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <EmptyState
            title="No se pudieron cargar tus logros"
            description="Error leyendo la base local."
            blob="⚠"
          />
        </View>
      </View>
    );
  }

  const best = streak.data?.bestStreak ?? 0;
  const current = streak.data?.currentStreak ?? 0;
  const level = Math.min(10, Math.floor(best / 3) + 1);
  const { catalog, unlocked } = achievements.data!;
  const unlockedIds = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));
  const doneCount = unlocked.length;
  const visible = view === 'mine' ? catalog.filter((a) => a.isCustom) : catalog;

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('Borrar medalla', `¿Eliminar «${title}»?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () =>
          removeCustom.mutate(id, {
            onSuccess: () => toast.show('Medalla borrada', 'success'),
            onError: (e) => toast.show(e instanceof Error ? e.message : 'No se pudo borrar', 'error'),
          }),
      },
    ]);
  };

  /** HU-27 — activar/desactivar el freeze manual con confirmación. */
  const confirmFreeze = () => {
    const today = localDateISO();
    const frozen = freezes.data?.frozenToday ?? false;
    if (frozen) {
      Alert.alert('Desactivar freeze', '¿Quitar la protección de la racha de hoy?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: () =>
            toggleFreeze.mutate(
              { date: today, activate: false },
              {
                onSuccess: () => toast.show('Freeze desactivado', 'success'),
                onError: (e) =>
                  toast.show(e instanceof Error ? e.message : 'No se pudo desactivar', 'error'),
              },
            ),
        },
      ]);
      return;
    }
    const remaining = freezes.data?.available ?? 0;
    Alert.alert(
      'Congelar racha',
      `Protege tu racha de hoy con 1 freeze. Quedan ${remaining}/2 este mes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Congelar',
          onPress: () =>
            toggleFreeze.mutate(
              { date: today, activate: true },
              {
                onSuccess: () => toast.show('Racha congelada ❄', 'success'),
                onError: (e) =>
                  toast.show(
                    e instanceof Error ? e.message : 'Cuota de freeze agotada',
                    'error',
                  ),
              },
            ),
        },
      ],
    );
  };

  if (catalog.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <EmptyState title="Sin medallas aún" description="El seed de logros no se cargó." blob="✦" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(240)} style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Nivel</Text>
            <Text style={styles.heroLevel}>{level}</Text>
          </View>
          <View style={styles.heroStats}>
            <Stat label="Racha" value={`${current}`} suffix="🔥" />
            <Stat label="Mejor" value={`${best}`} suffix="🏆" />
            <Stat label="Medallas" value={`${doneCount}/${catalog.length}`} suffix="🎖️" />
          </View>
        </Animated.View>

        <ClayButton
          label={
            freezes.data?.frozenToday
              ? '❄ Racha congelada hoy — desactivar'
              : `❄ Congelar racha · quedan ${freezes.data?.available ?? 0}/2`
          }
          variant={freezes.data?.frozenToday ? 'secondary' : 'ghost'}
          onPress={confirmFreeze}
        />

        <Text style={styles.section}>Calendario del mes</Text>
        <View style={styles.calendar}>
          <Text style={styles.calCaption}>
            Días con logros completados en {now.toLocaleDateString('es-ES', { month: 'long' })}
          </Text>
          <View style={styles.calRow}>
            {buildMonthCells(now, month.data ?? []).map((c) => (
              <View
                key={c.key}
                style={[
                  styles.calCell,
                  c.done && styles.calCellDone,
                  c.off && styles.calCellOff,
                ]}
              >
                <Text style={[styles.calDay, c.done && styles.calDayDone]}>{c.day || ''}</Text>
              </View>
            ))}
          </View>
        </View>

        {heatmap.data ? (
          <YearHeatmap weeks={heatmap.data.weeks} labels={heatmap.data.labels} />
        ) : null}

        <View style={styles.medalsHeader}>
          <Text style={styles.section}>Medallas</Text>
          <ClayButton
            label="+ Crear"
            variant="secondary"
            onPress={() => router.push('/(modals)/new-logro')}
          />
        </View>
        <ChipsTabs options={VIEWS} value={view} onChange={setView} labels={VIEW_LABELS} />

        {view === 'mine' && visible.length === 0 ? (
          <EmptyState
            title="Aún no tienes medallas propias"
            description="Crea una con el criterio que quieras: hábito, meta o ambos."
            blob="✦"
            action={
              <ClayButton
                label="Crear medalla"
                onPress={() => router.push('/(modals)/new-logro')}
              />
            }
          />
        ) : (
          <View style={styles.grid}>
            {visible.map((a) => (
              <View key={a.id} style={styles.gridCell}>
                <AchievementCard
                  achievement={{
                    id: a.id,
                    icon: a.icon,
                    title: a.title,
                    description: a.description,
                  }}
                  unlocked={unlockedIds.has(a.id)}
                  unlockedAt={unlockedIds.get(a.id)}
                />
                {a.isCustom ? (
                  <View style={styles.customActions}>
                    <ClayButton
                      label="Editar"
                      variant="ghost"
                      onPress={() =>
                        router.push({
                          pathname: '/(modals)/new-logro',
                          params: { achievementId: a.id },
                        })
                      }
                    />
                    <ClayButton
                      label="Borrar"
                      variant="ghost"
                      disabled={removeCustom.isPending}
                      onPress={() => confirmDelete(a.id, a.title)}
                    />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>
        {value} <Text style={styles.statSuffix}>{suffix}</Text>
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface Cell {
  key: string;
  day: number;
  done: boolean;
  off: boolean;
}

function buildMonthCells(now: Date, dates: string[]): Cell[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const doneSet = new Set(dates);
  const days = new Date(y, m + 1, 0).getDate();
  const offset = new Date(y, m, 1).getDay();
  const cells: Cell[] = [];
  for (let i = 0; i < offset; i++) cells.push({ key: `p${i}`, day: 0, done: false, off: true });
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ key: iso, day: d, done: doneSet.has(iso), off: false });
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
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
  },
  heroLeft: {
    alignItems: 'center',
    minWidth: 64,
  },
  heroLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
    textTransform: 'uppercase',
  },
  heroLevel: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 40,
    color: palette.primary,
    fontVariant: ['tabular-nums'],
  },
  heroStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 18,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  statSuffix: {
    fontSize: 14,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: palette.textMuted,
  },
  section: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 17,
    color: palette.text,
    marginTop: spacing.sm,
  },
  calendar: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  calCaption: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
    textTransform: 'capitalize',
  },
  calRow: {
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
  calCellOff: {
    backgroundColor: 'transparent',
  },
  calDay: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: palette.textMuted,
    fontVariant: ['tabular-nums'],
  },
  calDayDone: {
    color: palette.surface,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCell: {
    width: '48.5%',
  },
  medalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  customActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
