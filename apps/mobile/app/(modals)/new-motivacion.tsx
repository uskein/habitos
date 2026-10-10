import { CreateMotivationInput, MOTIVATION_TRIGGERS, type CreateMotivationInputType } from '@habitos/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';
import { useGoals } from '@/features/goals/useGoals';
import { useCreateMotivation } from '@/features/motivations/useMotivations';
import { useToast } from '@/ui/feedback/Toast';
import { ChipsTabs } from '@/ui/navigation/ChipsTabs';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayCard } from '@/ui/primitives/ClayCard';
import { ClayInput } from '@/ui/primitives/ClayInput';

const TRIGGER_LABELS = {
  no_streak: 'Sin racha',
  morning: 'Mañana',
  missed_day: 'Día perdido',
} as const;

/** Sheet crear motivación — HU-24 · F16 · BP 15 (con preview de la card). */
export default function NewMotivacionSheet() {
  const toast = useToast();
  const create = useCreateMotivation();
  const goals = useGoals('active');
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('🔥');
  const [trigger, setTrigger] = useState<(typeof MOTIVATION_TRIGGERS)[number]>('no_streak');
  const [goalId, setGoalId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const textError =
    touched && text.trim().length === 0
      ? 'El texto es obligatorio'
      : touched && text.trim().length > 140
        ? 'Máximo 140 caracteres'
        : undefined;

  const submit = () => {
    setTouched(true);
    const input: CreateMotivationInputType = {
      text: text.trim(),
      emoji: emoji.trim() || '🔥',
      goalId,
      triggerType: trigger,
    };
    const parsed = CreateMotivationInput.safeParse(input);
    if (!parsed.success) {
      toast.show('Revisa los campos del formulario', 'error');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        toast.show('Motivación guardada 💪', 'success');
        router.back();
      },
      onError: (e) => toast.show(e instanceof Error ? e.message : 'No se pudo guardar', 'error'),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Nueva motivación</Text>

      <ClayInput
        label="Mensaje"
        placeholder="Ej. Un paso cada día cuenta"
        value={text}
        onChangeText={setText}
        onBlur={() => setTouched(true)}
        maxLength={140}
        error={textError}
        helper={`${text.trim().length}/140`}
      />
      <ClayInput
        label="Emoji"
        placeholder="🔥"
        value={emoji}
        onChangeText={setEmoji}
        maxLength={4}
      />

      <Text style={styles.label}>Cuándo aparece</Text>
      <ChipsTabs
        options={MOTIVATION_TRIGGERS}
        value={trigger}
        onChange={setTrigger}
        labels={TRIGGER_LABELS}
      />

      <Text style={styles.label}>Ligar a una meta (opcional)</Text>
      <View style={styles.goalRow}>
        <ClayButton
          label="Sin meta"
          variant={goalId === null ? 'primary' : 'secondary'}
          onPress={() => setGoalId(null)}
        />
        {(goals.data ?? []).map((g) => (
          <ClayButton
            key={g.id}
            label={g.title}
            variant={goalId === g.id ? 'primary' : 'secondary'}
            onPress={() => setGoalId(g.id)}
          />
        ))}
      </View>

      <Text style={styles.label}>Así se verá en Hoy</Text>
      <ClayCard style={styles.preview}>
        <Text style={styles.previewEmoji}>{emoji || '🔥'}</Text>
        <Text style={styles.previewText}>{text.trim() || 'Tu mensaje motivacional…'}</Text>
        <Text style={styles.previewSub}>
          {goalId ? `Meta: ${goals.data?.find((g) => g.id === goalId)?.title ?? ''}` : 'Para ti hoy'}
        </Text>
      </ClayCard>

      <ClayButton
        label="Guardar motivación"
        loading={create.isPending}
        disabled={create.isPending || text.trim().length === 0}
        onPress={submit}
        style={styles.submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    color: palette.text,
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 14,
    color: palette.text,
    marginTop: spacing.sm,
    marginLeft: 4,
  },
  goalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  preview: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  previewEmoji: {
    fontSize: 32,
  },
  previewText: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 16,
    color: palette.text,
    textAlign: 'center',
  },
  previewSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
