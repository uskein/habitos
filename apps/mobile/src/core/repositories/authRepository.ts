import { ERROR_CODES, AppError } from '@habitos/shared';
import * as LocalAuthentication from 'expo-local-authentication';
import type { AuthRepository } from '../domain/repositoryInterfaces';
import { PrefKeys, prefs } from '../storage/preferences';
import * as pinStore from '../storage/pinStore';

export const authRepository: AuthRepository = {
  isPinConfigured: () => pinStore.isPinConfigured(),

  setupPin: (pin) => pinStore.setupPin(pin),

  async verifyPin(pin) {
    try {
      return await pinStore.verifyPin(pin);
    } catch (e) {
      if (e instanceof AppError && e.code === ERROR_CODES.RATE_LIMITED) throw e;
      return false;
    }
  },

  async unlockWithBiometrics() {
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Hábitos',
        disableDeviceFallback: false,
      });
      return res.success;
    } catch {
      return false;
    }
  },

  lock() {
    prefs.set(PrefKeys.locked, true);
  },
};
