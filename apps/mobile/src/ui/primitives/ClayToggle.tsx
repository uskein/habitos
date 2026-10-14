import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';
import { components, durations, easings } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';

export interface ClayToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  testID?: string;
}

const THUMB = components.toggleHeight - 6;
const TRAVEL = components.toggleWidth - THUMB - 6;

/** Toggle 52×32 — thumb surface, track primary/off con transición clay. */
export function ClayToggle({ value, onValueChange, disabled = false, testID }: ClayToggleProps) {
  const { colors } = useAppTheme();
  const haptics = useHaptics();
  const reduceMotion = useReducedMotion() ?? false;

  const styles = useMemo(() => StyleSheet.create({
    pressable: {
      width: components.toggleWidth,
      height: components.toggleHeight,
      justifyContent: 'center',
    },
    track: {
      width: components.toggleWidth,
      height: components.toggleHeight,
      borderRadius: components.toggleHeight / 2,
      backgroundColor: colors.track,
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
      backgroundColor: colors.surface,
    },
  }), [colors]);

  const progress = useAnimatedStyle(() => {
    const x = value ? TRAVEL : 0;
    if (reduceMotion) return { transform: [{ translateX: x }] };
    return {
      transform: [
        {
          translateX: withTiming(x, {
            duration: durations.d3,
            easing: Easing.bezier(...(easings.clay as [number, number, number, number])),
          }),
        },
      ],
    };
  });

  // El worklet captura los colores del render actual; al cambiar de tema se
  // re-crea con la paleta activa (transición animada vía withTiming).
  const trackStyle = useAnimatedStyle(() => {
    const bg = value ? colors.primary : colors.track;
    if (reduceMotion) return { backgroundColor: bg };
    return {
      backgroundColor: withTiming(bg, {
        duration: durations.d2,
        easing: Easing.bezier(...(easings.std as [number, number, number, number])),
      }),
    };
  });

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
