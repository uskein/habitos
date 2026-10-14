import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { shareChallengeText } from '@/core/domain/services/challengeProgress';
import { useAppTheme, type ActivePalette } from '@/core/theme/ThemeProvider';
import { fonts, shadows, spacing } from '@/core/theme/theme';
import {
  useChallenges,
  useCompleteChallenge,
  useRemoveChallenge,
} from '@/features/challenges/useChallenges';
import type { ChallengeProgress } from '@/core/domain/entities/challenge';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { useToast } from '@/ui/feedback/Toast';
import { AppBar } from '@/ui/navigation/AppBar';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayCard } from '@/ui/primitives/ClayCard';
import { Progress } from '@/ui/feedback/Progress';

function makeStyles(colors: ActivePalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    body: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.md,
      paddingBottom: 96,
    },
    intro: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 19,
    },
    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: { fontSize: 22 },
    titleWrap: { flex: 1, gap: 2 },
    title: {
      fontFamily: fonts.display,
      fontWeight: '700',
      fontSize: 15,
      color: colors.text,
    },
    habit: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    stat: {
      fontFamily: fonts.mono,
      fontSize: 12,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    statStrong: {
      fontFamily: fonts.mono,
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.fab,
    },
    fabIcon: {
      color: colors.surface,
      fontSize: 30,
      lineHeight: 34,
      fontWeight: '600',
    },
  });
}

/** Retos activos (M36) — progreso por check-ins, compartir y abandonar. */
export default function ChallengesScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const toast = useToast();
  const challenges = useChallenges();
  const remove = useRemoveChallenge();
  const complete = useCompleteChallenge();

  const share = (item: ChallengeProgress) => {
    void Share.share({
      message: shareChallengeText({
        name: item.challenge.name,
        habitName: item.challenge.habitName,
        completedDays: item.completedDays,
        days: item.challenge.days,
      }),
    });
  };

  const confirmAbandon = (item: ChallengeProgress) => {
    Alert.alert('Abandonar reto', `¿Eliminar «${item.challenge.name}»?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Abandonar',
        style: 'destructive',
        onPress: () =>
          remove.mutate(item.challenge.id, {
            onSuccess: () => toast.show('Reto abandonado', 'success'),
            onError: (e) =>
              toast.show(e instanceof Error ? e.message : 'No se pudo eliminar', 'error'),
          }),
      },
    ]);
  };

  const archiveComplete = (item: ChallengeProgress) => {
    complete.mutate(item.challenge.id, {
      onSuccess: () => toast.show('¡Reto completado! 🏆', 'success'),
      onError: () => toast.show('No se pudo archivar', 'error'),
    });
  };

  if (challenges.isPending) {
    return (
      <View style={styles.screen}>
        <AppBar title="Retos" onBack={() => router.back()} />
        <View style={styles.body}>
          <Skeleton height={110} borderRadius={24} />
          <Skeleton height={110} borderRadius={24} />
        </View>
      </View>
    );
  }

  const list = challenges.data ?? [];

  return (
    <View style={styles.screen}>
      <AppBar title="Retos" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Retos de N días sobre un hábito. Cada check-in cuenta — no hace falta racha perfecta.
        </Text>
        {list.length === 0 ? (
          <EmptyState
            title="Sin retos activos"
            description="Crea un reto de 7, 14, 30, 60 o 90 días y comparte tu progreso."
            blob="🏆"
            action={
              <ClayButton
                label="Crear reto"
                onPress={() => router.push('/(modals)/new-challenge')}
              />
            }
          />
        ) : (
          list.map((item, i) => (
            <Animated.View key={item.challenge.id} entering={FadeIn.delay(i * 40).duration(200)}>
              <ClayCard style={undefined}>
                <View style={styles.cardHead}>
                  <View style={styles.iconBox}>
                    <Text style={styles.icon}>{item.challenge.habitIcon}</Text>
                  </View>
                  <View style={styles.titleWrap}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.challenge.name}
                    </Text>
                    <Text style={styles.habit} numberOfLines={1}>
                      {item.challenge.habitName}
                    </Text>
                  </View>
                </View>
                <Progress progress={item.percent / 100} />
                <View style={styles.statsRow}>
                  <Text style={styles.stat}>
                    Día {Math.min(item.currentDay, item.challenge.days)}/{item.challenge.days}
                  </Text>
                  <Text style={styles.stat}>{item.completedDays} check-ins</Text>
                  <Text style={styles.statStrong}>{item.percent}%</Text>
                </View>
                <View style={styles.actions}>
                  <ClayButton
                    label="Compartir"
                    variant="secondary"
                    onPress={() => share(item)}
                  />
                  {item.completedDays >= item.challenge.days ? (
                    <ClayButton
                      label="Archivar 🏆"
                      variant="ghost"
                      onPress={() => archiveComplete(item)}
                    />
                  ) : null}
                  <ClayButton
                    label="Abandonar"
                    variant="ghost"
                    disabled={remove.isPending}
                    onPress={() => confirmAbandon(item)}
                  />
                </View>
              </ClayCard>
            </Animated.View>
          ))
        )}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Crear reto"
        onPress={() => router.push('/(modals)/new-challenge')}
        style={({ pressed }) => [
          styles.fab,
          pressed && { transform: [{ scale: 0.94 }] },
        ]}
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </View>
  );
}
