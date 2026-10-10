import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { fonts, palette, shadows, spacing } from '@/core/theme/theme';
import { useToast } from '@/ui/feedback/Toast';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Progress } from '@/ui/feedback/Progress';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { HabitCard } from '@/features/habits/HabitCard';
import { StreakCard } from '@/features/habits/StreakCard';
import { CheckInCard } from '@/features/wellbeing/CheckInCard';
import { useGlobalStreak, useHabitsToday, useProfile, useToggleLog } from '@/features/habits/useHabits';

function greetingFor(h: number): string {
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Tab Hoy — BLUEPRINTS §3 máquina de estados (Loading/Empty/Success/Error). */
export default function HoyScreen() {
  const toast = useToast();
  const profile = useProfile();
  const streak = useGlobalStreak();
  const habits = useHabitsToday();
  const toggle = useToggleLog();

  if (habits.isPending || profile.isPending) {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Skeleton height={96} borderRadius={24} />
          <Skeleton height={20} width="40%" />
          <Skeleton height={76} borderRadius={24} />
          <Skeleton height={76} borderRadius={24} />
          <Skeleton height={76} borderRadius={24} />
        </View>
      </View>
    );
  }

  if (habits.isError) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <EmptyState
            title="No se pudo cargar tu día"
            description="Ocurrió un error leyendo la base de datos local."
            blob="⚠"
            action={
              <ClayButton label="Reintentar" onPress={() => void habits.refetch()} />
            }
          />
        </View>
      </View>
    );
  }

  const list = habits.data ?? [];
  const greeting = `${greetingFor(new Date().getHours())}, ${profile.data?.displayName ?? ''}`;
  const completed = list.filter((h) => h.log?.completed).length;

  if (list.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.greeting}>{greeting}</Text>
          <EmptyState
            title="Aún no tienes hábitos"
            description="Crea tu primer hábito y empieza tu racha hoy."
            blob="✦"
            action={
              <ClayButton
                label="Crear hábito"
                onPress={() => router.push('/(modals)/new-habit')}
              />
            }
          />
        </View>
        <Fab />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(240)}>
          <StreakCard
            greeting={greeting}
            globalStreak={streak.data?.currentStreak ?? 0}
            completedCount={completed}
            totalCount={list.length}
          />
        </Animated.View>

        <View style={styles.progress}>
          <Progress progress={list.length === 0 ? 0 : completed / list.length} />
        </View>

        <CheckInCard />

        <View style={styles.list}>
          {list.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              disabled={toggle.isPending}
              onToggle={() => {
                toggle.mutate(
                  { habitId: h.id, date: h.log?.logDate ?? new Date().toISOString().slice(0, 10) },
                  {
                    onSuccess: (log) => {
                      if (log.completed) toast.show('¡Hábito completado! 🔥', 'success');
                    },
                    onError: () => toast.show('No se pudo guardar', 'error'),
                  },
                );
              }}
            />
          ))}
        </View>
      </ScrollView>
      <Fab />
    </View>
  );
}

function Fab() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Crear hábito"
      onPress={() => router.push('/(modals)/new-habit')}
      style={({ pressed }) => [styles.fab, shadows.fab, pressed && { transform: [{ scale: 0.94 }] }]}
    >
      <Text style={styles.fabIcon}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  body: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 96,
  },
  greeting: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 22,
    color: palette.text,
  },
  progress: {
    marginHorizontal: 4,
  },
  list: {
    gap: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    color: palette.surface,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '600',
  },
});
