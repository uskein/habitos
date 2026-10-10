import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/ui/feedback/Badge';
import { ClayCard } from '@/ui/primitives/ClayCard';
import { fonts, palette, spacing } from '@/core/theme/theme';

export interface StreakCardProps {
  greeting: string;
  globalStreak: number;
  completedCount: number;
  totalCount: number;
}

/** StreakCard — BLUEPRINTS §4: cifra mono + chip Nivel + progreso del día. */
export function StreakCard({ greeting, globalStreak, completedCount, totalCount }: StreakCardProps) {
  const pct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <ClayCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.sub}>
            {completedCount}/{totalCount} completados · {pct}%
          </Text>
        </View>
        <Badge label={`Nivel ${Math.min(10, Math.floor(globalStreak / 3) + 1)}`} tint="warning" />
      </View>
      <View style={styles.streakRow}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={styles.streakNumber}>{globalStreak}</Text>
        <Text style={styles.streakLabel}>
          {globalStreak === 1 ? 'día de racha' : 'días de racha'}
        </Text>
      </View>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    gap: 2,
  },
  greeting: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 20,
    color: palette.text,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textMuted,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  flame: {
    fontSize: 26,
  },
  streakNumber: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 40,
    color: palette.primary,
    fontVariant: ['tabular-nums'],
  },
  streakLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: palette.textMuted,
  },
});
