import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';
import { useAchievements } from '@/features/achievements/useAchievements';
import { AchievementCard } from '@/features/achievements/AchievementCard';
import { useMonthCompletedDates } from '@/features/achievements/useMonthStats';
import { useGlobalStreak } from '@/features/habits/useHabits';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Skeleton } from '@/ui/feedback/Skeleton';

/** Tab Logros — HU-12/HU-13: racha, nivel, calendario del mes y medallas. */
export default function AchievementsScreen() {
  const streak = useGlobalStreak();
  const achievements = useAchievements();
  const now = new Date();
  const month = useMonthCompletedDates(now.getFullYear(), now.getMonth());

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

        <Text style={styles.section}>Medallas</Text>
        <View style={styles.grid}>
          {catalog.map((a) => (
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
            </View>
          ))}
        </View>
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
    padding: spacing.md,
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
});
