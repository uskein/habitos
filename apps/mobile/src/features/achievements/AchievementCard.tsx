import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';

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
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.sm + 2,
          gap: 6,
          alignItems: 'center',
          minHeight: 150,
        },
        cardLocked: {
          backgroundColor: colors.surfaceAlt,
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
          backgroundColor: colors.awardSoft,
          borderWidth: 2,
          borderColor: colors.award,
        },
        medalOff: {
          backgroundColor: colors.border,
        },
        icon: {
          fontSize: 26,
        },
        title: {
          fontFamily: fonts.display,
          fontWeight: '700',
          fontSize: 14,
          color: colors.text,
          textAlign: 'center',
        },
        desc: {
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textMuted,
          textAlign: 'center',
        },
        textLocked: {
          color: colors.textMuted,
        },
        date: {
          fontFamily: fonts.mono,
          fontSize: 11,
          color: colors.primary,
          fontVariant: ['tabular-nums'],
        },
      }),
    [colors],
  );

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
