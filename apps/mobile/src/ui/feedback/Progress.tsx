import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { durations, easings, palette, radii } from '@/core/theme/theme';

export interface ProgressProps {
  /** 0–1 */
  progress: number;
  color?: string;
  trackColor?: string;
}

/** Barra de progreso con fill animado (std ease). */
export function Progress({ progress, color = palette.primary, trackColor = palette.track }: ProgressProps) {
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
      style={[styles.track, { backgroundColor: trackColor }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
    </View>
  );
}

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
