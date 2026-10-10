import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { components, durations, easings, palette } from '@/core/theme/theme';
import { useHaptics } from '@/hooks/useHaptics';

export interface ClayToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  testID?: string;
}

const THUMB = components.toggleHeight - 6;
const TRAVEL = components.toggleWidth - THUMB - 6;

/** Toggle 52×32 — thumb blanco, track primary/off con transición clay. */
export function ClayToggle({ value, onValueChange, disabled = false, testID }: ClayToggleProps) {
  const haptics = useHaptics();

  const progress = useAnimatedStyle(() => ({
    transform: [{
      translateX: withTiming(value ? TRAVEL : 0, {
        duration: durations.d3,
        easing: Easing.bezier(...(easings.clay as [number, number, number, number])),
      }),
    }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(value ? palette.primary : palette.track, {
      duration: durations.d2,
      easing: Easing.bezier(...(easings.std as [number, number, number, number])),
    }),
  }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.selection();
        onValueChange(!value);
      }}
      style={[styles.pressable, disabled && styles.disabled]}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, progress]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: components.toggleWidth,
    height: components.toggleHeight,
    justifyContent: 'center',
  },
  track: {
    width: components.toggleWidth,
    height: components.toggleHeight,
    borderRadius: components.toggleHeight / 2,
    backgroundColor: palette.track,
    padding: 3,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: palette.surface,
  },
});
