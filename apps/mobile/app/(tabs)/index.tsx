import { router } from 'expo-router';
import { localDateISO } from '@habitos/shared';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { fonts, shadows, spacing } from '@/core/theme/theme';
import { useAppTheme, type ActivePalette } from '@/core/theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrefKeys, prefs } from '@/core/storage/preferences';
import { useToast } from '@/ui/feedback/Toast';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Progress } from '@/ui/feedback/Progress';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { HabitCard } from '@/features/habits/HabitCard';
import { StreakCard } from '@/features/habits/StreakCard';
import { CheckInCard } from '@/features/wellbeing/CheckInCard';
import {
  useGlobalStreak,
  useHabitsToday,
  useProfile,
  useToggleLog,
  useWeekCompletedDays,
  useWeekProgressByHabit,
} from '@/features/habits/useHabits';
import { useFreezes } from '@/features/habits/useFreezes';
import {
  saveWidgetSnapshot,
  syncHabitWidget,
  type WidgetHabit,
} from '@/features/widgets/habitWidget';

/** V5 · M42 — opciones de meta semanal configurable (días por semana). */
const WEEK_TARGET_OPTIONS = [3, 4, 5, 6, 7] as const;
const DEFAULT_WEEK_TARGET = 5;

function greetingFor(h: number): string {
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Estilos dependientes de la paleta activa — se recalculan por tema. */
const makeStyles = (colors: ActivePalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.lg,
    },
    body: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.md,
      paddingBottom: 96,
    },
    greeting: {
      fontFamily: fonts.display,
      fontWeight: '700',
      fontSize: 22,
      color: colors.text,
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
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabIcon: {
      color: colors.surface,
      fontSize: 30,
      lineHeight: 34,
      fontWeight: '600',
    },
  });

/** Tab Hoy — BLUEPRINTS §3 máquina de estados (Loading/Empty/Success/Error). */
export default function HoyScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const profile = useProfile();
  const streak = useGlobalStreak();
  const habits = useHabitsToday();
  const freezes = useFreezes();
  const toggle = useToggleLog();
  const [onlyReminders, setOnlyReminders] = useState(false);
  const weekDays = useWeekCompletedDays();
  const weekProgress = useWeekProgressByHabit();
  /** Meta semanal configurable (M42): objetivo de días con al menos un hábito. */
  const [weekTarget, setWeekTarget] = useState<number>(
    () => prefs.getNumber(PrefKeys.weeklyGoalTarget) ?? DEFAULT_WEEK_TARGET,
  );
  const weekDone = weekDays.data ?? 0;
  const weekMet = weekDone >= weekTarget;

  /** Cambia el objetivo de la meta semanal (3–7 días) con diálogo nativo. */
  const pickWeekTarget = () => {
    Alert.alert(
      'Meta semanal',
      '¿Cuántos días por semana quieres cumplir?',
      [
        ...WEEK_TARGET_OPTIONS.map((n) => ({
          text: `${n} días`,
          onPress: () => {
            prefs.set(PrefKeys.weeklyGoalTarget, n);
            setWeekTarget(n);
            toast.show(`Meta semanal: ${n} días`, 'success');
          },
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
      { cancelable: true },
    );
  };

  // M34 · widget: snapshot del día → home screen (best-effort, sin bloquear la UI).
  useEffect(() => {
    const list = habits.data;
    if (!list) return;
    const widgetHabits: WidgetHabit[] = list.slice(0, 3).map((h) => ({
      icon: h.icon,
      name: h.name,
      done: h.log?.completed ?? false,
    }));
    saveWidgetSnapshot({
      completed: list.filter((h) => h.log?.completed).length,
      total: list.length,
      habits: widgetHabits,
    });
    void syncHabitWidget();
  }, [habits.data]);

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
  const filteredList = onlyReminders ? list.filter((h) => h.reminderTime) : list;

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
        <Fab insets={insets} />
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
            freezesLeft={freezes.data?.available}
            frozenToday={freezes.data?.frozenToday}
          />
        </Animated.View>

        <View style={styles.progress}>
          <Progress progress={list.length === 0 ? 0 : completed / list.length} />
        </View>

        {/* M40/M42 · meta semanal configurable — toca para cambiar el objetivo */}
        <Pressable
          onPress={pickWeekTarget}
          accessibilityRole="button"
          accessibilityLabel={`Meta semanal: ${weekDone} de ${weekTarget} días. Toca para cambiar el objetivo`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: weekMet ? colors.success : colors.border,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: '600', color: colors.text }}>
            🎯 Meta semanal: {weekDone}/{weekTarget} días
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {weekMet ? (
              <Text style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: '700', color: colors.success }}>
                ¡Cumplida! 🎉
              </Text>
            ) : (
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted }}>
                {Math.round((weekDone / weekTarget) * 100)}%
              </Text>
            )}
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted }}>›</Text>
          </View>
        </Pressable>

        {/* Filtro: solo hábitos con recordatorio */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Pressable
            onPress={() => setOnlyReminders((v: boolean) => !v)}
            accessibilityRole="switch"
            accessibilityState={{ checked: onlyReminders }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: onlyReminders ? colors.primary : colors.border,
              backgroundColor: onlyReminders ? colors.primarySoft : 'transparent',
            }}
          >
            <Text style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: '600', color: onlyReminders ? colors.primary : colors.textMuted }}>
              ⏰ Solo recordatorios
            </Text>
          </Pressable>
          {onlyReminders && (
            <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted }}>
              {filteredList.length} de {list.length}
            </Text>
          )}
        </View>

        <CheckInCard />

        <ClayButton
          label="+ Motivación"
          variant="ghost"
          onPress={() => router.push('/(modals)/new-motivacion')}
        />

        <View style={styles.list}>
          {filteredList.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              disabled={toggle.isPending}
              weekDone={weekProgress.data?.[h.id] ?? 0}
              onToggle={() => {
                toggle.mutate(
                  { habitId: h.id, date: h.log?.logDate ?? localDateISO() },
                  {
                    onSuccess: (log) => {
                      if (log.completed) {
                        toast.show('¡Hábito completado! 🔥', 'success', {
                          label: 'Deshacer',
                          onPress: () =>
                            toggle.mutate(
                              { habitId: h.id, date: log.logDate },
                              { onError: () => toast.show('No se pudo deshacer', 'error') },
                            ),
                        });
                      }
                    },
                    onError: () => toast.show('No se pudo guardar', 'error'),
                  },
                );
              }}
            />
          ))}
        </View>
      </ScrollView>
      <Fab insets={insets} />
    </View>
  );
}

function Fab({ insets }: { insets: { bottom: number } }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Crear hábito"
      onPress={() => router.push('/(modals)/new-habit')}
      style={({ pressed }) => [
        styles.fab,
        { bottom: insets.bottom + 24 },
        shadows.fab,
        pressed && { transform: [{ scale: 0.94 }] },
      ]}
    >
      <Text style={styles.fabIcon}>+</Text>
    </Pressable>
  );
}
