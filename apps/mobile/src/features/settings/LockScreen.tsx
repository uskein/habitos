import { AppError, ERROR_CODES } from '@habitos/shared';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { authRepository } from '@/core/repositories/authRepository';
import { getPinLockRemainingMs } from '@/core/storage/pinStore';
import { fonts, palette, spacing } from '@/core/theme/theme';
import { ClayLoader } from '@/ui/feedback/ClayLoader';
import { useToast } from '@/ui/feedback/Toast';
import { PinPad } from '@/ui/navigation/PinPad';

type LockState = 'idle' | 'verifying' | 'unlocking' | 'error' | 'rateLimited';

export interface LockScreenProps {
  onUnlocked: () => void;
}

/** Lock global — BLUEPRINTS §3 «ciclo de seguridad» + F6 RATE_LIMITED. */
export function LockScreen({ onUnlocked }: LockScreenProps) {
  const toast = useToast();
  const [pin, setPin] = useState('');
  const [state, setState] = useState<LockState>('idle');
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(() => Math.ceil(getPinLockRemainingMs() / 1000));
  const shake = useSharedValue(0);

  const runShake = () => {
    shake.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withRepeat(withSequence(withTiming(8, { duration: 50 }), withTiming(-8, { duration: 50 })), 3, true),
      withTiming(0, { duration: 50 }),
    );
  };

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const verify = useCallback(
    async (candidate: string) => {
      setState('verifying');
      try {
        const ok = await authRepository.verifyPin(candidate);
        if (ok) {
          setState('unlocking');
          onUnlocked();
          return;
        }
        setError(true);
        runShake();
        toast.show('PIN incorrecto', 'error');
        setState('idle');
        setPin('');
      } catch (e) {
        if (e instanceof AppError && e.code === ERROR_CODES.RATE_LIMITED) {
          setState('rateLimited');
          setCountdown(Math.ceil(getPinLockRemainingMs() / 1000));
          toast.show(e.message, 'error');
        } else {
          toast.show('No se pudo verificar', 'error');
          setState('idle');
        }
        setPin('');
      }
    },
    [onUnlocked, toast],
  );

  // Intento biométrico automático al entrar (HU-2)
  useEffect(() => {
    let active = true;
    (async () => {
      const ok = await authRepository.unlockWithBiometrics();
      if (active && ok) onUnlocked();
    })();
    return () => {
      active = false;
    };
  }, [onUnlocked]);

  // Backoff RateLimited → Idle
  useEffect(() => {
    if (state !== 'rateLimited') return;
    const t = setInterval(() => {
      const left = Math.ceil(getPinLockRemainingMs() / 1000);
      setCountdown(left);
      if (left <= 0) {
        clearInterval(t);
        setState('idle');
      }
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  // 6 dígitos → verificar
  useEffect(() => {
    if (pin.length === 6 && state === 'idle') void verify(pin);
  }, [pin, state, verify]);

  return (
    <View style={styles.overlay}>
      <View style={styles.center}>
        <Text style={styles.brand}>Hábitos</Text>
        <Text style={styles.subtitle}>
          {state === 'rateLimited'
            ? `Demasiados intentos — ${countdown}s`
            : state === 'unlocking'
              ? 'Desbloqueando…'
              : 'Ingresa tu PIN'}
        </Text>
        <Animated.View style={shakeStyle}>
          <PinPad value={pin} onChange={setPin} error={error} />
        </Animated.View>
        <Text
          onPress={async () => {
            if (await authRepository.unlockWithBiometrics()) onUnlocked();
          }}
          style={styles.bio}
          accessibilityRole="button"
        >
          Usar biometría
        </Text>
      </View>
      {/* HU-16 · V2 — overlay blur 10 + spinner 800 ms lineal mientras verifica */}
      <ClayLoader
        visible={state === 'verifying' || state === 'unlocking'}
        label={state === 'unlocking' ? 'Desbloqueando…' : 'Validando…'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.bg,
    zIndex: 1000,
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  brand: {
    fontFamily: fonts.display,
    fontWeight: '800',
    fontSize: 32,
    color: palette.primary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: palette.textMuted,
  },
  bio: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 15,
    color: palette.primary,
    padding: spacing.sm,
  },
});
