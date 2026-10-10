import { StyleSheet, Text, View } from 'react-native';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';

export interface AchievementCardData {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface AchievementCardProps {
  achievement: AchievementCardData;
  unlocked: boolean;
  unlockedAt?: string;
}

/** AchievementCard — medalla con estado desbloqueada/bloqueada (HU-13). */
export function AchievementCard({ achievement, unlocked, unlockedAt }: AchievementCardProps) {
  return (
    <View style={[styles.card, !unlocked && styles.cardLocked]}>
      <View style={[styles.medal, unlocked ? styles.medalOn : styles.medalOff]}>
        <Text style={styles.icon}>{unlocked ? achievement.icon : '🔒'}</Text>
      </View>
      <Text style={[styles.title, !unlocked && styles.textLocked]} numberOfLines={1}>
        {achievement.title}
      </Text>
      <Text style={[styles.desc, !unlocked && styles.textLocked]} numberOfLines={2}>
        {achievement.description}
      </Text>
      {unlocked && unlockedAt ? (
        <Text style={styles.date}>{unlockedAt.slice(0, 10)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.sm + 2,
    gap: 6,
    alignItems: 'center',
    minHeight: 150,
  },
  cardLocked: {
    backgroundColor: palette.surfaceAlt,
    borderStyle: 'dashed',
  },
  medal: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  medalOn: {
    backgroundColor: palette.awardSoft,
    borderWidth: 2,
    borderColor: palette.award,
  },
  medalOff: {
    backgroundColor: palette.border,
  },
  icon: {
    fontSize: 26,
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 14,
    color: palette.text,
    textAlign: 'center',
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
    textAlign: 'center',
  },
  textLocked: {
    color: palette.textMuted,
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: palette.primary,
    fontVariant: ['tabular-nums'],
  },
});
