import {
  CreateCustomAchievementInput,
  type CreateCustomAchievementInputType,
} from '@habitos/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import {
  useAchievements,
  useCreateCustomAchievement,
  useUpdateCustomAchievement,
} from '@/features/achievements/useAchievements';
import { useGoals } from '@/features/goals/useGoals';
import { useActiveHabits } from '@/features/milestones/useMilestones';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { useToast } from '@/ui/feedback/Toast';
import { ChipsTabs } from '@/ui/navigation/ChipsTabs';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayCard } from '@/ui/primitives/ClayCard';
import { ClayCheckbox } from '@/ui/primitives/ClayCheckbox';
import { ClayInput } from '@/ui/primitives/ClayInput';

const TYPES = ['habit_count', 'goal_complete', 'combined'] as const;
const MODES = ['any', 'all'] as const;
const TYPE_LABELS = { habit_count: 'Hábito', goal_complete: 'Meta', combined: 'Ambos' } as const;
const MODE_LABELS = { any: 'Cualquiera', all: 'Todos' } as const;

/**
 * Sheet crear/editar medalla — HU-21/22/23 · F14/F15 · BP 16/17.
 * is_custom = 1; edición solo de medallas propias (semillas bloqueadas).
 */
export default function NewLogroSheet() {
  const { colors } = useAppTheme();

  const styles = useMemo(() => StyleSheet.create({
    body: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: 48,
      paddingTop: spacing.sm,
    },
    title: {
      fontFamily: fonts.display,
      fontWeight: '700',
      fontSize: 22,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    label: {
      fontFamily: fonts.display,
      fontWeight: '700',
      fontSize: 14,
      color: colors.text,
      marginTop: spacing.sm,
      marginLeft: 4,
    },
    groupTitle: {
      fontFamily: fonts.body,
      fontWeight: '600',
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    linkCard: {
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    error: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.error,
      marginLeft: 4,
    },
    submit: {
      marginTop: spacing.lg,
    },
  }), [colors]);

  const toast = useToast();
  const { achievementId } = useLocalSearchParams<{ achievementId?: string }>();
  const achievements = useAchievements();
  const habits = useActiveHabits();
  const goals = useGoals('active');
  const create = useCreateCustomAchievement();
  const update = useUpdateCustomAchievement();

  const existing = achievementId
    ? achievements.data?.catalog.find((a) => a.id === achievementId)
    : undefined;
  const isEdit = !!existing;

  const [title, setTitle] = useState(() => existing?.title ?? '');
  const [description, setDescription] = useState(() => existing?.description ?? '');
  const [icon, setIcon] = useState(() => existing?.icon ?? '🏅');
  // La edición solo se abre desde medallas propias (is_custom) → criterio custom garantizado.
  const [type, setType] = useState<(typeof TYPES)[number]>(
    () => (existing?.criteria.type as (typeof TYPES)[number] | undefined) ?? 'habit_count',
  );
  const [threshold, setThreshold] = useState(() => String(existing?.criteria.threshold ?? 7));
  const [mode, setMode] = useState<(typeof MODES)[number]>(() => existing?.criteria.mode ?? 'any');
  const [habitIds, setHabitIds] = useState<Set<string>>(
    () => new Set(existing?.criteria.habitIds ?? []),
  );
  const [goalIds, setGoalIds] = useState<Set<string>>(
    () => new Set(existing?.criteria.goalIds ?? []),
  );
  const [touched, setTouched] = useState(false);

  if (habits.isPending || goals.isPending || (achievementId && achievements.isPending)) {
    return (
      <View style={styles.body}>
        <Text style={styles.title}>{isEdit ? 'Editar medalla' : 'Nueva medalla'}</Text>
        <Skeleton height={56} borderRadius={16} />
        <Skeleton height={120} borderRadius={16} />
        <Skeleton height={100} borderRadius={16} />
      </View>
    );
  }

  if (habits.isError || goals.isError) {
    return (
      <View style={styles.body}>
        <EmptyState
          title="No se pudieron cargar tus hábitos y metas"
          blob="⚠"
          action={<ClayButton label="Reintentar" onPress={() => { void habits.refetch(); void goals.refetch(); }} />}
        />
      </View>
    );
  }

  const needHabits = type !== 'goal_complete';
  const needGoals = type !== 'habit_count';
  const noLinks =
    (!needHabits || (habits.data?.length ?? 0) === 0) &&
    (!needGoals || (goals.data?.length ?? 0) === 0);

  if (noLinks) {
    return (
      <View style={styles.body}>
        <EmptyState
          title="Aún no puedes crear medallas"
          description="Necesitas al menos 1 hábito o meta para vincular."
          blob="✦"
          action={<ClayButton label="Cerrar" variant="secondary" onPress={() => router.back()} />}
        />
      </View>
    );
  }

  const thresholdNum = Number(threshold.replace(',', '.'));
  const titleError = touched && title.trim().length === 0 ? 'El nombre es obligatorio' : undefined;
  const thresholdError =
    touched && (!Number.isInteger(thresholdNum) || thresholdNum < 1)
      ? 'El umbral debe ser ≥ 1'
      : undefined;
  const linksOk =
    (habitIds.size + goalIds.size >= 1) &&
    (type === 'goal_complete' || habitIds.size >= 1) &&
    (type !== 'combined' || goalIds.size >= 1);
  const linksError = touched && !linksOk ? 'Revisa los vínculos del criterio' : undefined;

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  const submit = () => {
    setTouched(true);
    const input: CreateCustomAchievementInputType = {
      title: title.trim(),
      description: description.trim() || undefined,
      icon: icon.trim() || '🏅',
      criteria: {
        type,
        threshold: thresholdNum,
        ...(needHabits ? { habitIds: [...habitIds] } : {}),
        ...(needGoals ? { goalIds: [...goalIds] } : {}),
        mode,
      },
      progressStyle: existing?.progressStyle ?? 'bar',
      unlockMode: existing?.unlockMode ?? 'auto',
    };
    const parsed = CreateCustomAchievementInput.safeParse(input);
    if (!parsed.success) {
      toast.show('Revisa los campos del formulario', 'error');
      return;
    }
    if (isEdit && achievementId) {
      update.mutate(
        { achievementId, input: parsed.data },
        {
          onSuccess: () => {
            toast.show('Medalla actualizada', 'success');
            router.back();
          },
          onError: (e) => toast.show(e instanceof Error ? e.message : 'No se pudo editar', 'error'),
        },
      );
    } else {
      create.mutate(parsed.data, {
        onSuccess: () => {
          toast.show('Medalla creada ✨', 'success');
          router.back();
        },
        onError: (e) => toast.show(e instanceof Error ? e.message : 'No se pudo crear', 'error'),
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{isEdit ? 'Editar medalla' : 'Nueva medalla'}</Text>

      <ClayInput
        label="Nombre"
        placeholder="Ej. Semana perfecta"
        value={title}
        onChangeText={setTitle}
        onBlur={() => setTouched(true)}
        maxLength={40}
        error={titleError}
        helper={`${title.trim().length}/40`}
      />
      <ClayInput
        label="Emoji"
        placeholder="🏅"
        value={icon}
        onChangeText={setIcon}
        onBlur={() => setTouched(true)}
        maxLength={8}
        error={touched && icon.trim().length === 0 ? 'Añade un emoji' : undefined}
      />
      <ClayInput
        label="Descripción (opcional)"
        placeholder="Ej. 7 días seguidos"
        value={description}
        onChangeText={setDescription}
        maxLength={80}
      />

      <Text style={styles.label}>Criterio</Text>
      <ChipsTabs options={TYPES} value={type} onChange={setType} labels={TYPE_LABELS} />
      <ClayInput
        label="Umbral (días/meta)"
        placeholder="7"
        value={threshold}
        onChangeText={setThreshold}
        onBlur={() => setTouched(true)}
        keyboardType="number-pad"
        error={thresholdError}
        helper="Mínimo 1"
      />
      <Text style={styles.label}>Modo</Text>
      <ChipsTabs options={MODES} value={mode} onChange={setMode} labels={MODE_LABELS} />

      {linksError ? <Text style={styles.error}>{linksError}</Text> : null}

      {needHabits && (habits.data?.length ?? 0) > 0 ? (
        <ClayCard style={styles.linkCard}>
          <Text style={styles.groupTitle}>Hábitos</Text>
          {habits.data!.map((h) => (
            <ClayCheckbox
              key={h.id}
              label={`${h.icon}  ${h.name}`}
              checked={habitIds.has(h.id)}
              onCheckedChange={() => setHabitIds((prev) => toggle(prev, h.id))}
            />
          ))}
        </ClayCard>
      ) : null}

      {needGoals && (goals.data?.length ?? 0) > 0 ? (
        <ClayCard style={styles.linkCard}>
          <Text style={styles.groupTitle}>Metas</Text>
          {goals.data!.map((g) => (
            <ClayCheckbox
              key={g.id}
              label={g.title}
              checked={goalIds.has(g.id)}
              onCheckedChange={() => setGoalIds((prev) => toggle(prev, g.id))}
            />
          ))}
        </ClayCard>
      ) : null}

      <ClayButton
        label={isEdit ? 'Guardar cambios' : 'Crear medalla'}
        loading={create.isPending || update.isPending}
        disabled={create.isPending || update.isPending || title.trim().length === 0}
        onPress={submit}
        style={styles.submit}
      />
    </ScrollView>
  );
}
