import { StyleSheet, Text, View } from 'react-native';
import type { Goal } from '@/core/domain/entities/goal';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';
import { Badge } from '@/ui/feedback/Badge';
import { Progress } from '@/ui/feedback/Progress';
import { ClayCard } from '@/ui/primitives/ClayCard';

export interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
}

/** GoalCard — título, progreso mono-tabular, badge de estado. */
export function GoalCard({ goal, onPress }: GoalCardProps) {
  const pct = goal.targetValue === 0 ? 0 : Math.min(1, goal.currentValue / goal.targetValue);

  return (
    <ClayCard onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {goal.title}
        </Text>
        <Badge
          label={goal.status === 'active' ? 'Activa' : goal.status === 'completed' ? 'Cumplida' : 'Abandonada'}
          tint={goal.status === 'completed' ? 'success' : goal.status === 'active' ? 'purple' : 'danger'}
        />
      </View>
      <View style={styles.numbers}>
        <Text style={styles.value}>
          {goal.currentValue}
          <Text style={styles.target}>
            {' '}
            / {goal.targetValue} {goal.unit ?? ''}
          </Text>
        </Text>
        <Text style={styles.pct}>{Math.round(pct * 100)}%</Text>
      </View>
      <Progress progress={pct} color={goal.status === 'completed' ? palette.success : palette.primary} />
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 16,
    color: palette.text,
  },
  numbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  value: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 20,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  target: {
    fontFamily: fonts.body,
    fontWeight: '400',
    fontSize: 13,
    color: palette.textMuted,
  },
  pct: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: palette.primary,
    fontVariant: ['tabular-nums'],
  },
});
