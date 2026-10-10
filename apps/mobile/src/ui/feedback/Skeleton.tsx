import { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { durations, easings, palette, radii } from '@/core/theme/theme';

export interface SkeletonProps {
  width?: ViewStyle['width'];
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/** Skeleton con pulse suave (opacity 0.5↔1). */
export function Skeleton({ width = '100%', height = 16, borderRadius = radii.sm, style }: SkeletonProps) {
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, {
        duration: durations.d5,
        easing: Easing.bezier(...(easings.std as [number, number, number, number])),
      }),
      -1,
      true,
    );
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      style={[{ width, height, borderRadius, backgroundColor: palette.surfaceAlt }, animated, style]}
    />
  );
}
