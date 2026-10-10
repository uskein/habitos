import { LIMITS } from '@habitos/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { userProfileRepository } from '@/core/repositories/userProfileRepository';
import { fonts, palette, spacing } from '@/core/theme/theme';
import { useToast } from '@/ui/feedback/Toast';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayInput } from '@/ui/primitives/ClayInput';

/** Edición de identidad — HU-1 (1–40 caracteres). */
export default function EditProfileSheet() {
  const toast = useToast();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const error =
    name.length > 0 && name.trim().length === 0
      ? 'El nombre no puede ser solo espacios'
      : undefined;
  const disabled = name.trim().length === 0 || name.trim().length > LIMITS.PROFILE_NAME_MAX;

  const submit = async () => {
    setBusy(true);
    try {
      await userProfileRepository.updateName(name);
      toast.show('Nombre actualizado', 'success');
      router.back();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Editar perfil</Text>
      <ClayInput
        label="Nombre"
        placeholder="Tu nombre"
        value={name}
        onChangeText={setName}
        maxLength={LIMITS.PROFILE_NAME_MAX}
        error={error}
        helper={`${name.trim().length}/${LIMITS.PROFILE_NAME_MAX}`}
      />
      <ClayButton
        label="Guardar"
        loading={busy}
        disabled={busy || disabled}
        onPress={() => void submit()}
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
