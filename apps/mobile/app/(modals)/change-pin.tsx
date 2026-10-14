import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { changePin } from '@/core/storage/pinStore';
import { fonts, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import { useToast } from '@/ui/feedback/Toast';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayInput } from '@/ui/primitives/ClayInput';

/** Cambio de PIN — R7: solo desde Perfil → Seguridad (exige PIN actual). */
export default function ChangePinSheet() {
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
    submit: {
      marginTop: spacing.lg,
    },
  }), [colors]);

  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (current.length !== 6 || next.length !== 6) {
      toast.show('Los PIN deben tener 6 dígitos', 'error');
      return;
    }
    if (next !== confirm) {
      toast.show('La confirmación no coincide', 'error');
      return;
    }
    if (next === current) {
      toast.show('El nuevo PIN debe ser distinto', 'error');
      return;
    }
    setBusy(true);
    try {
      await changePin(current, next);
      toast.show('PIN actualizado', 'success');
      router.back();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'No se pudo cambiar', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Cambiar PIN</Text>
      <ClayInput
        label="PIN actual"
        placeholder="••••••"
        value={current}
        onChangeText={(t) => setCurrent(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        helper="6 dígitos"
      />
      <ClayInput
        label="PIN nuevo"
        placeholder="••••••"
        value={next}
        onChangeText={(t) => setNext(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />
      <ClayInput
        label="Confirmar PIN nuevo"
        placeholder="••••••"
        value={confirm}
        onChangeText={(t) => setConfirm(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        error={confirm.length === 6 && confirm !== next ? 'Los PIN no coinciden' : undefined}
      />
      <ClayButton
        label="Guardar PIN"
        loading={busy}
        disabled={busy}
        onPress={() => void submit()}
        style={styles.submit}
      />
    </ScrollView>
  );
}
