import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import { useTodayEntry } from '@/features/wellbeing/useWellbeing';
import { ClayCard } from '@/ui/primitives/ClayCard';

const MOODS = ['😞', '😟', '😐', '🙂', '😄'];

const MOOD_LABELS: Record<number, string> = {
  1: 'Muy mal',
  2: 'Bajo',
  3: 'Neutral',
  4: 'Bien',
  5: 'Genial',
};

/** Mini-card de check-in en Hoy (F3/F9): precarga el sheet si ya existe hoy. */
export function CheckInCard() {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: spacing.md,
        },
        left: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          flex: 1,
        },
        emoji: {
          fontSize: 26,
        },
        texts: {
          gap: 1,
          flex: 1,
        },
        title: {
          fontFamily: fonts.body,
          fontWeight: '600',
          fontSize: 15,
          color: colors.text,
        },
        sub: {
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textMuted,
        },
        chevron: {
          fontSize: 22,
          color: colors.textMuted,
        },
      }),
    [colors],
  );
  const entry = useTodayEntry();
  const e = entry.data;

  return (
    <ClayCard
      style={styles.card}
      onPress={() => router.push('/(modals)/check-in')}
    >
      <View style={styles.left}>
        <Text style={styles.emoji}>{e ? MOODS[e.mood - 1] : '✨'}</Text>
        <View style={styles.texts}>
          <Text style={styles.title}>{e ? 'Check-in de hoy' : 'Hacer check-in'}</Text>
          <Text style={styles.sub}>
            {e
              ? `${MOOD_LABELS[e.mood] ?? ''} · energía ${e.energy}/5 · tocar para editar`
              : 'Ánimo y energía en un toque'}
          </Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </ClayCard>
  );
}
