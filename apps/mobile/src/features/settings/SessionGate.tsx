import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { getDb } from '@/core/data/database';
import { authRepository } from '@/core/repositories/authRepository';
import { userProfileRepository } from '@/core/repositories/userProfileRepository';
import { PrefKeys, prefs } from '@/core/storage/preferences';
import { sessionBus } from '@/core/storage/sessionBus';
import { palette } from '@/core/theme/theme';
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';
import { LockScreen } from '@/features/settings/LockScreen';
import { Spinner } from '@/ui/feedback/Spinner';

type Phase = 'boot' | 'onboarding' | 'locked' | 'app';

/**
 * Gate global de sesión — R4 (auto-lock en background) + R7 (onboarding ida).
 * Único punto que decide entre onboarding / lock / app.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('boot');

  const lockEnabled = () =>
    (prefs.getBoolean(PrefKeys.lockEnabled) ?? false) &&
    (prefs.getBoolean(PrefKeys.onboardingDone) ?? false);

  const boot = useCallback(async () => {
    try {
      await getDb();
      const done = prefs.getBoolean(PrefKeys.onboardingDone) ?? false;
      if (!done) {
        setPhase('onboarding');
        return;
      }
      if (lockEnabled()) {
        prefs.set(PrefKeys.locked, true);
        setPhase('locked');
      } else {
        setPhase('app');
      }
    } catch {
      // BD inesperada → quedamos en app y los hooks mostrarán estado Error
      setPhase('app');
    }
  }, []);

  useEffect(() => {
    void boot();
  }, [boot]);

  // R4: auto-lock al pasar a background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background' && lockEnabled()) {
        authRepository.lock();
        setPhase('locked');
      }
    });
    return () => sub.remove();
  }, []);

  // Bloqueo inmediato solicitado desde Perfil
  useEffect(() => {
    return sessionBus.subscribe(() => {
      if (lockEnabled()) {
        authRepository.lock();
        setPhase('locked');
      }
    });
  }, []);

  if (phase === 'boot') {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </View>
    );
  }

  if (phase === 'onboarding') {
    return <OnboardingFlow onFinished={() => setPhase('app')} />;
  }

  if (phase === 'locked') {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <LockScreen
          onUnlocked={() => {
            prefs.set(PrefKeys.locked, false);
            void userProfileRepository.get();
            setPhase('app');
          }}
        />
      </View>
    );
  }

  return <>{children}</>;
}
