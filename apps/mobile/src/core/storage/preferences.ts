import { createMMKV } from 'react-native-mmkv';

/** Prefs locales (no sensibles) — PIN hash vive en SecureStore, nunca aquí. */
export const prefs = createMMKV({ id: 'habitos-prefs' });

export const PrefKeys = {
  onboardingDone: 'onboarding.done',
  lockEnabled: 'lock.enabled',
  biometrics: 'lock.biometrics',
  locked: 'lock.locked',
  pinAttempts: 'lock.pinAttempts',
  pinLockedUntil: 'lock.pinLockedUntil',
  notificationsAsked: 'onboarding.notificationsAsked',
  notificationsEnabled: 'notifications.enabled',
  reminderIds: 'notifications.reminderIds',
  themeMode: 'theme.mode',
} as const;
