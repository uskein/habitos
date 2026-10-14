import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { habitRepository } from '@/core/repositories/habitRepository';
import { badgeTints, fonts, habitSwatches, palette, shadows, spacing } from '@/core/theme/theme';
import { useHabitsToday, useProfile } from '@/features/habits/useHabits';
import { GoalCard } from '@/features/goals/GoalCard';
import { useGoals, useDeleteGoal } from '@/features/goals/useGoals';
import { ChipsTabs } from '@/ui/navigation/ChipsTabs';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayCard } from '@/ui/primitives/ClayCard';
import { useToast } from '@/ui/feedback/Toast';

const TABS = ['habitos', 'metas'] as const;
type Tab = (typeof TABS)[number];

const SLOT_LABELS: Record<string, string> = {
  morning: '☀ mañana',
  afternoon: '🌤 tarde',
  evening: '🌙 noche',
};

/** Tab Plan — M5: chips Hábitos/Metas, detalle y archivar (HU-7…HU-10). */
export default function PlanScreen() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('habitos');
  const profile = useProfile();
  const habits = useHabitsToday();
  const goals = useGoals();
  const deleteGoal = useDeleteGoal();

  const loading = habits.isPending || goals.isPending || profile.isPending;
  const error = habits.isError || goals.isError;

  const openHabit = (id: string) => router.push({ pathname: '/habit/[id]', params: { id } });
  const openGoal = (id: string) => router.push({ pathname: '/goal/[id]', params: { id } });

  const archive = async (id: string, name: string) => {
    try {
      await habitRepository.archive(id);
      toast.show(`«${name}» archivado`, 'success');
      await habits.refetch();
    } catch {
      toast.show('No se pudo archivar', 'error');
    }
  };

  const confirmDeleteGoal = (id: string, title: string) => {
    Alert.alert('Eliminar meta', `¿Eliminar «${title}»? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          deleteGoal.mutate(id, {
            onSuccess: () => toast.show(`Meta «${title}» eliminada`, 'success'),
            onError: () => toast.show('No se pudo eliminar la meta', 'error'),
          }),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ChipsTabs options={TABS} value={tab} onChange={setTab} labels={{ habitos: 'Hábitos', metas: 'Metas' }} />

      {loading ? (
        <View style={styles.loading}>
          <Skeleton height={88} borderRadius={24} />
          <Skeleton height={88} borderRadius={24} />
          <Skeleton height={88} borderRadius={24} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <EmptyState
            title="No se pudo cargar"
            description="Error leyendo los datos locales."
            blob="⚠"
            action={<ClayButton label="Reintentar" onPress={() => { void habits.refetch(); void goals.refetch(); }} />}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(240)}>
            {tab === 'habitos' ? (
              (habits.data ?? []).length === 0 ? (
                <EmptyState
                  title="Sin hábitos todavía"
                  description="Crea uno desde el botón + de Hoy."
                  blob="◌"
                />
              ) : (
                <View style={styles.list}>
                  {(habits.data ?? []).map((h) => (
                    <ClayCard
                      key={h.id}
                      onPress={() => openHabit(h.id)}
                      onLongPress={() => archive(h.id, h.name)}
                      accessibilityLabel={`Hábito ${h.name}`}
                      style={styles.habitCard}
                    >
                      <View
                        style={[
                          styles.habitIcon,
                          {
                            backgroundColor:
                              habitSwatches[h.colorToken as keyof typeof habitSwatches] ??
                              palette.surfaceAlt,
                          },
                        ]}
                      >
                        <Text style={styles.habitIconText}>{h.icon}</Text>
                      </View>
                      <View style={styles.habitTexts}>
                        <Text style={styles.habitName} numberOfLines={1}>
                          {h.name}
                        </Text>
                        <Text style={styles.habitMeta} numberOfLines={1}>
                          {h.category} · {h.frequency === 'daily' ? 'diario' : 'personalizado'}
                          {h.timeSlot ? ` · ${SLOT_LABELS[h.timeSlot] ?? ''}` : ''}
                        </Text>
                      </View>
                      {h.log?.completed ? (
                        <View style={styles.donePill}>
                          <Text style={styles.donePillText}>✓ Hoy</Text>
                        </View>
                      ) : null}
                      <Text style={styles.chevron}>›</Text>
                    </ClayCard>
                  ))}
                  <Text style={styles.hint}>Toca para ver detalle · mantén pulsado para archivar</Text>
                </View>
              )
            ) : (goals.data ?? []).length === 0 ? (
              <EmptyState
                title="Sin metas todavía"
                description="Crea una meta con objetivo numérico y registra tu progreso."
                blob="🎯"
                action={
                  <ClayButton label="Crear meta" onPress={() => router.push('/(modals)/new-goal')} />
                }
              />
            ) : (
              <View style={styles.list}>
                {(goals.data ?? []).map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    onPress={() => openGoal(g.id)}
                    onLongPress={() => confirmDeleteGoal(g.id, g.title)}
                  />
                ))}
                <Text style={styles.hint}>Toca para ver detalle · mantén pulsado para eliminar</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tab === 'habitos' ? 'Nuevo hábito' : 'Nueva meta'}
        onPress={() =>
          tab === 'habitos'
            ? router.push('/(modals)/new-habit')
            : router.push('/(modals)/new-goal')
        }
        style={({ pressed }) => [styles.fab, shadows.fab, pressed && { transform: [{ scale: 0.94 }] }]}
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scroll: {
    flex: 1,
  },
  loading: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.sm,
    paddingBottom: 96,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
  },
  habitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIconText: {
    fontSize: 22,
  },
  habitTexts: {
    flex: 1,
    gap: 2,
  },
  habitName: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 16,
    color: palette.text,
  },
  habitMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
    textTransform: 'capitalize',
  },
  donePill: {
    backgroundColor: badgeTints.success.bg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  donePillText: {
    fontFamily: fonts.body,
    fontWeight: '700',
    fontSize: 11,
    color: badgeTints.success.text,
  },
  chevron: {
    fontSize: 24,
    color: palette.textMuted,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
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
