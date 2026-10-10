import { LIMITS } from '@habitos/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { userProfileRepository } from '@/core/repositories/userProfileRepository';
import { fonts, palette, spacing } from '@/core/theme/theme';
import { useAvatarPicker } from '@/features/settings/useAvatarPicker';
import { useProfile } from '@/features/habits/useHabits';
import { useToast } from '@/ui/feedback/Toast';
import { ClayAvatar } from '@/ui/primitives/ClayAvatar';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayInput } from '@/ui/primitives/ClayInput';

/** Edición de identidad — HU-1 (1–40 caracteres) + foto HU-14. */
export default function EditProfileSheet() {
  const toast = useToast();
  const profile = useProfile();
  const avatar = useAvatarPicker();
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

  const displayName = profile.data?.displayName ?? '';

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Editar perfil</Text>

      <View style={styles.photoBlock}>
        <ClayAvatar
          name={displayName}
          size={88}
          photoUri={profile.data?.photoUri}
          onPressCamera={() => void avatar.pickPhoto()}
        />
        <View style={styles.photoActions}>
          <ClayButton
            label="Cambiar foto"
            variant="secondary"
            loading={avatar.busy}
            onPress={() => void avatar.pickPhoto()}
          />
          {profile.data?.photoUri ? (
            <ClayButton
              label="Quitar foto"
              variant="ghost"
              disabled={avatar.busy}
              onPress={() => void avatar.removePhoto()}
            />
          ) : null}
        </View>
      </View>

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
  photoBlock: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  submit: {
    marginTop: spacing.lg,
  },
});
