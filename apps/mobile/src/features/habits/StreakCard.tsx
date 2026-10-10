import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/ui/feedback/Badge';
import { ClayCard } from '@/ui/primitives/ClayCard';
import { fonts, palette, spacing } from '@/core/theme/theme';

export interface StreakCardProps {
  greeting: string;
  globalStreak: number;
  completedCount: number;
  totalCount: number;
  /** V2.1 · HU-27 — freezes restantes del mes (0..2). */
  freezesLeft?: number;
  /** Hoy está protegido por un freeze. */
  frozenToday?: boolean;
}

/** StreakCard — BLUEPRINTS §4: cifra mono + chip Nivel + progreso del día. */
export function StreakCard({
  greeting,
  globalStreak,
  completedCount,
  totalCount,
  freezesLeft,
  frozenToday,
}: StreakCardProps) {
  const pct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const usedFreezes = freezesLeft === undefined ? null : Math.max(0, 2 - freezesLeft);

  return (
    <ClayCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.sub}>
            {completedCount}/{totalCount} completados · {pct}%
          </Text>
        </View>
        <View style={styles.headerChips}>
          {usedFreezes !== null && (
            <View style={styles.freezeChip}>
              <Text style={styles.freezeChipText}>❄ {usedFreezes}/2</Text>
            </View>
          )}
          <Badge label={`Nivel ${Math.min(10, Math.floor(globalStreak / 3) + 1)}`} tint="warning" />
        </View>
      </View>
      <View style={styles.streakRow}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={styles.streakNumber}>{globalStreak}</Text>
        <Text style={styles.streakLabel}>
          {globalStreak === 1 ? 'día de racha' : 'días de racha'}
        </Text>
      </View>
      {frozenToday && (
        <Text style={styles.frozenNote}>❄ Racha congelada hoy — un freeze se usó este mes</Text>
      )}
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
  headerChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  freezeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: palette.surface,
  },
  freezeChipText: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 11,
    color: palette.textMuted,
    fontVariant: ['tabular-nums'],
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
  frozenNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
    textAlign: 'center',
  },
});
