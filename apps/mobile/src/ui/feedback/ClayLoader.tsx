import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { durations, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';

export interface ClayLoaderProps {
  visible: boolean;
  label?: string;
}

/**
 * ClayLoader (V2 · manual §8.2) — overlay blur 10 con velo bg 55 % y spinner
 * de arco primary sobre track, giro 800 ms lineal infinito. Fade in/out 200 ms.
 * Con reduced-motion el spinner se congela en un frame estático (texto visible).
 */
export function ClayLoader({ visible, label = 'Validando…' }: ClayLoaderProps) {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const spin = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    fade.value = withTiming(visible ? 1 : 0, { duration: durations.d1 + 80 });
    if (visible && !reduced) {
      spin.value = 0;
      spin.value = withRepeat(
        withTiming(1, { duration: 800, easing: Easing.linear }),
        -1,
        false,
      );
    }
  }, [visible, reduced, fade, spin]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          ...StyleSheet.absoluteFill,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        },
        veil: {
          ...StyleSheet.absoluteFill,
          backgroundColor: colors.bg,
          opacity: 0.55,
        },
        center: {
          alignItems: 'center',
          gap: spacing.md,
        },
        spinner: {
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: 4,
          borderColor: colors.track,
          borderTopColor: colors.primary,
        },
        label: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.textMuted,
        },
      }),
    [colors],
  );

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} accessibilityRole="alert">
      <BlurView intensity={10} style={StyleSheet.absoluteFill} />
      <View style={styles.veil} />
      <View style={styles.center} accessibilityLiveRegion="polite">
        <Animated.View style={[styles.spinner, spinnerStyle]} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const SIZE = 36;
