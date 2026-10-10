import { localDateISO } from '@habitos/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { habitRepository } from '@/core/repositories/habitRepository';
import { fonts, palette, shadows, spacing } from '@/core/theme/theme';
import { useHabitsToday, useProfile } from '@/features/habits/useHabits';
import { GoalCard } from '@/features/goals/GoalCard';
import { useGoals } from '@/features/goals/useGoals';
import { ChipsTabs } from '@/ui/navigation/ChipsTabs';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { useToast } from '@/ui/feedback/Toast';

const TABS = ['habitos', 'metas'] as const;
type Tab = (typeof TABS)[number];

/** Tab Plan — M5: chips Hábitos/Metas, detalle y archivar (HU-7…HU-10). */
export default function PlanScreen() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('habitos');
  const profile = useProfile();
  const habits = useHabitsToday();
  const goals = useGoals();

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

  return (
    <View style={styles.screen}>
      <ChipsTabs options={TABS} value={tab} onChange={setTab} labels={{ habitos: 'Hábitos', metas: 'Metas' }} />

      {loading ? (
        <View style={styles.body}>
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
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
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
                    <Pressable
                      key={h.id}
                      onPress={() => openHabit(h.id)}
                      onLongPress={() => archive(h.id, h.name)}
                      accessibilityRole="button"
                      style={styles.row}
                    >
                      <Text style={styles.rowIcon}>{h.icon}</Text>
                      <View style={styles.rowTexts}>
                        <Text style={styles.rowTitle}>{h.name}</Text>
                        <Text style={styles.rowSub}>
                          {h.category} · {h.frequency === 'daily' ? 'diario' : 'personalizado'}
                        </Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </Pressable>
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
                  <GoalCard key={g.id} goal={g} onPress={() => openGoal(g.id)} />
                ))}
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
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowIcon: {
    fontSize: 24,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 16,
    color: palette.text,
  },
  rowSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
    textTransform: 'capitalize',
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
