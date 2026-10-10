import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  components,
  durations,
  easings,
  fonts,
  palette,
  radii,
  type Theme,
} from '@/core/theme/theme';
import { useHaptics } from '@/hooks/useHaptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ClayButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const bgByVariant: Record<Variant, string> = {
  primary: palette.primary,
  secondary: palette.surfaceAlt,
  ghost: 'transparent',
  danger: palette.error,
};

const textByVariant: Record<Variant, string> = {
  primary: palette.surface,
  secondary: palette.primary,
  ghost: palette.primary,
  danger: palette.surface,
};

export function ClayButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  testID,
}: ClayButtonProps) {
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion() ?? false;
  const inactive = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPressIn={() => {
          if (reduceMotion) return;
          scale.value = withTiming(0.97, {
            duration: durations.d1,
            easing: Easing.bezier(...(easings.std as [number, number, number, number])),
          });
        }}
        onPressOut={() => {
          if (reduceMotion) return;
          scale.value = withTiming(1, {
            duration: durations.d2,
            easing: Easing.bezier(...(easings.std as [number, number, number, number])),
          });
        }}
        onPress={() => {
          haptics.light();
          onPress();
        }}
        style={[
          styles.base,
          {
            backgroundColor: inactive
              ? palette.primaryDisabledBg
              : bgByVariant[variant],
          },
          variant === 'ghost' && !inactive && styles.ghostBorder,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textByVariant[variant]} />
        ) : (
          <>
            {leftIcon}
            <Text
              style={[
                styles.label,
                {
                  color: inactive ? palette.primaryDisabledText : textByVariant[variant],
                },
              ]}
            >
              {label}
            </Text>
            {rightIcon}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: components.buttonHeight,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  ghostBorder: {
    borderWidth: 1.5,
    borderColor: palette.primary,
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 16,
  },
});

export type ThemeColors = Theme['palette'];
