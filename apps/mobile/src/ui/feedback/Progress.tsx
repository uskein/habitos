import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { durations, easings, radii } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';

export interface ProgressProps {
  /** 0–1 */
  progress: number;
  color?: string;
  trackColor?: string;
}

/** Barra de progreso con fill animado (std ease). */
export function Progress({ progress, color, trackColor }: ProgressProps) {
  const { colors } = useAppTheme();
  const fill = color ?? colors.primary;
  const track = trackColor ?? colors.track;
  const clamped = Math.min(1, Math.max(0, progress));
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(clamped, {
      duration: durations.d4,
      easing: Easing.bezier(...(easings.std as [number, number, number, number])),
    });
  }, [clamped, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      style={[styles.track, { backgroundColor: track }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: fill }, fillStyle]} />
    </View>
  );
}

/** Geométrico puro (sin color) — a nivel de módulo. */
const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
