import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';

/** Microhápticas del manual — desactivadas con Reduced Motion. */
export function useHaptics() {
  const reduced = useReducedMotion();

  const selection = useCallback(() => {
    if (!reduced) Haptics.selectionAsync();
  }, [reduced]);

  const light = useCallback(() => {
    if (!reduced) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [reduced]);

  const success = useCallback(() => {
    if (!reduced) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [reduced]);

  const warning = useCallback(() => {
    if (!reduced) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [reduced]);

  return { selection, light, success, warning };
}
