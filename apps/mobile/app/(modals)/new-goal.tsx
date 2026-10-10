import { CreateGoalInput, type CreateGoalInputType } from '@habitos/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { fonts, palette, spacing } from '@/core/theme/theme';
import { useCreateGoal } from '@/features/goals/useGoals';
import { useToast } from '@/ui/feedback/Toast';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayInput } from '@/ui/primitives/ClayInput';

/** Bottom sheet crear meta — HU-9 (objetivo numérico > 0). */
export default function NewGoalSheet() {
  const toast = useToast();
  const create = useCreateGoal();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [due, setDue] = useState('');
  const [touched, setTouched] = useState(false);

  const titleError =
    touched && title.trim().length === 0 ? 'El título es obligatorio' : undefined;
  const targetNum = Number(target.replace(',', '.'));
  const targetError =
    touched && (!Number.isFinite(targetNum) || targetNum <= 0)
      ? 'El objetivo debe ser un número mayor que 0'
      : undefined;

  const submit = () => {
    setTouched(true);
    const input: CreateGoalInputType = {
      title: title.trim(),
      targetValue: targetNum,
      unit: unit.trim() || undefined,
      dueDate: due.trim() || undefined,
    };
    const parsed = CreateGoalInput.safeParse(input);
    if (!parsed.success) {
      toast.show('Revisa los campos del formulario', 'error');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        toast.show('Meta creada 🎯', 'success');
        router.back();
      },
      onError: (e) => toast.show(e instanceof Error ? e.message : 'No se pudo crear', 'error'),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Nueva meta</Text>
      <ClayInput
        label="Título"
        placeholder="Ej. Correr 100 km este mes"
        value={title}
        onChangeText={setTitle}
        onBlur={() => setTouched(true)}
        maxLength={80}
        error={titleError}
      />
      <ClayInput
        label="Objetivo"
        placeholder="Ej. 100"
        value={target}
        onChangeText={setTarget}
        onBlur={() => setTouched(true)}
        keyboardType="numeric"
        error={targetError}
        helper="Número positivo"
      />
      <ClayInput
        label="Unidad (opcional)"
        placeholder="km, páginas, min…"
        value={unit}
        onChangeText={setUnit}
        maxLength={12}
      />
      <ClayInput
        label="Fecha límite (opcional)"
        placeholder="YYYY-MM-DD"
        value={due}
        onChangeText={setDue}
        onBlur={() => setTouched(true)}
        keyboardType="numbers-and-punctuation"
        error={touched && due.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(due.trim()) ? 'Formato: YYYY-MM-DD' : undefined}
        helper="Ej. 2026-12-31"
      />
      <ClayButton
        label="Crear meta"
        loading={create.isPending}
        disabled={create.isPending || title.trim().length === 0 || !(Number.isFinite(targetNum) && targetNum > 0)}
        onPress={submit}
        style={styles.submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.sm,
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
  submit: {
    marginTop: spacing.lg,
  },
});
