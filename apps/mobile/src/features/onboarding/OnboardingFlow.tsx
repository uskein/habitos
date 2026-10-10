import { LIMITS } from '@habitos/shared';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { authRepository } from '@/core/repositories/authRepository';
import { userProfileRepository } from '@/core/repositories/userProfileRepository';
import { PrefKeys, prefs } from '@/core/storage/preferences';
import { fonts, palette, spacing } from '@/core/theme/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useToast } from '@/ui/feedback/Toast';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayInput } from '@/ui/primitives/ClayInput';
import { ClayToggle } from '@/ui/primitives/ClayToggle';
import { PinPad } from '@/ui/navigation/PinPad';

type Step = 0 | 1 | 2 | 3;

const STEP_KEY = 'onboarding.step';

/** Onboarding ida-sin-vuelta (R7): bienvenida → perfil → PIN → notificaciones. */
export function OnboardingFlow({ onFinished }: { onFinished: () => void }) {
  const toast = useToast();
  const haptics = useHaptics();

  const [step, setStep] = useState<Step>(() => {
    const saved = prefs.getNumber(STEP_KEY);
    if (saved != null && saved >= 0 && saved <= 3) return saved as Step;
    return 0;
  });
  const [name, setName] = useState('');
  const [pinEntry, setPinEntry] = useState('');
  const [pinFirst, setPinFirst] = useState<string | null>(null);
  const [bioEnabled, setBioEnabled] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    prefs.set(STEP_KEY, step);
  }, [step]);

  const nameValid = name.trim().length >= 1 && name.trim().length <= LIMITS.PROFILE_NAME_MAX;

  const finish = () => {
    prefs.set(PrefKeys.onboardingDone, true);
    prefs.remove(STEP_KEY);
    onFinished();
  };

  const confirmName = async () => {
    if (!nameValid) return;
    setBusy(true);
    try {
      await userProfileRepository.create(name);
      haptics.success();
      setStep(2);
    } catch {
      toast.show('No se pudo guardar el perfil', 'error');
    } finally {
      setBusy(false);
    }
  };

  const onPinComplete = async (value: string) => {
    if (pinFirst === null) {
      setPinFirst(value);
      setPinEntry('');
      return;
    }
    if (value !== pinFirst) {
      toast.show('Los PIN no coinciden. Inténtalo de nuevo', 'error');
      setPinFirst(null);
      setPinEntry('');
      return;
    }
    setBusy(true);
    try {
      await authRepository.setupPin(value);
      prefs.set(PrefKeys.lockEnabled, true);
      prefs.set(PrefKeys.biometrics, bioEnabled);
      haptics.success();
      setStep(3);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'No se pudo guardar el PIN', 'error');
      setPinFirst(null);
      setPinEntry('');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (pinEntry.length === 6 && step === 2) void onPinComplete(pinEntry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinEntry, step]);

  const askNotifications = async () => {
    try {
      await Notifications.requestPermissionsAsync();
    } catch {
      /* permiso denegado o no disponible → la app continúa (HU-3) */
    }
    prefs.set(PrefKeys.notificationsAsked, true);
    finish();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.progressDots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.pstep, i <= step && styles.pstepOn]} />
        ))}
      </View>

      {step === 0 && (
        <Animated.View key="s0" entering={FadeInRight.duration(240)} exiting={FadeOutLeft.duration(180)} style={styles.body}>
          <Text style={styles.logo}>Hábitos</Text>
          <Text style={styles.title}>Pequeños pasos, grandes rachas</Text>
          <Text style={styles.desc}>
            Crea hábitos, registra metas y cuida tu bienestar — todo en tu dispositivo, sin cuenta.
          </Text>
          <ClayButton label="Comenzar" onPress={() => setStep(1)} />
        </Animated.View>
      )}

      {step === 1 && (
        <Animated.View key="s1" entering={FadeInRight.duration(240)} exiting={FadeOutLeft.duration(180)} style={styles.body}>
          <Text style={styles.title}>¿Cómo te llamamos?</Text>
          <Text style={styles.desc}>Tu nombre se guarda solo en este dispositivo.</Text>
          <ClayInput
            label="Nombre"
            placeholder="Alex"
            value={name}
            onChangeText={setName}
            maxLength={LIMITS.PROFILE_NAME_MAX}
            autoFocus
            helper={`${name.trim().length}/${LIMITS.PROFILE_NAME_MAX} caracteres`}
          />
          <ClayButton label="Continuar" disabled={!nameValid} loading={busy} onPress={confirmName} />
        </Animated.View>
      )}

      {step === 2 && (
        <Animated.View key="s2" entering={FadeInRight.duration(240)} exiting={FadeOutLeft.duration(180)} style={styles.body}>
          <Text style={styles.title}>
            {pinFirst === null ? 'Crea un PIN de 6 dígitos' : 'Confirma tu PIN'}
          </Text>
          <Text style={styles.desc}>
            Se guarda cifrado en el SecureStore del sistema — nunca en la base de datos.
          </Text>
          <PinPad value={pinEntry} onChange={setPinEntry} />
          <View style={styles.bioRow}>
            <Text style={styles.bioLabel}>Desbloqueo biométrico</Text>
            <ClayToggle value={bioEnabled} onValueChange={setBioEnabled} />
          </View>
          {pinFirst !== null && (
            <Text
              style={styles.link}
              onPress={() => {
                setPinFirst(null);
                setPinEntry('');
              }}
            >
              Cambiar PIN inicial
            </Text>
          )}
        </Animated.View>
      )}

      {step === 3 && (
        <Animated.View key="s3" entering={FadeInRight.duration(240)} style={styles.body}>
          <Text style={styles.title}>¿Activar recordatorios?</Text>
          <Text style={styles.desc}>
            Es el único permiso que pide la app. Puedes cambiarlo después desde Perfil.
          </Text>
          <ClayButton label="Activar notificaciones" onPress={askNotifications} />
          <ClayButton label="Ahora no" variant="ghost" onPress={finish} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  pstep: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.border,
  },
  pstepOn: {
    backgroundColor: palette.primary,
    width: 24,
  },
  body: {
    gap: spacing.md,
  },
  logo: {
    fontFamily: fonts.display,
    fontWeight: '800',
    fontSize: 36,
    color: palette.primary,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 24,
    color: palette.text,
    textAlign: 'center',
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  bioLabel: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 15,
    color: palette.text,
  },
  link: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: palette.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
