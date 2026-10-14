import { useMemo, type ReactNode } from 'react';
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
  type SharedValue,
} from 'react-native-reanimated';
import {
  components,
  durations,
  easings,
  fonts,
  radii,
  type Theme,
} from '@/core/theme/theme';
import { useAppTheme, type ActivePalette } from '@/core/theme/ThemeProvider';
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

/** Mapas de variante que dependen de la paleta activa — se recalculan por tema. */
const bgByVariant = (colors: ActivePalette): Record<Variant, string> => ({
  primary: colors.primary,
  secondary: colors.surfaceAlt,
  ghost: 'transparent',
  danger: colors.error,
});

const textByVariant = (colors: ActivePalette): Record<Variant, string> => ({
  primary: colors.surface,
  secondary: colors.primary,
  ghost: colors.primary,
  danger: colors.surface,
});

const EASE_STD = Easing.bezier(...(easings.std as [number, number, number, number]));

/**
 * Mutación del shared value fuera del cuerpo del componente: la regla
 * react-hooks/immutability del compiler marca la asignación a `.value` hecha
 * desde closures creados en el render; recibiendo el SharedValue como
 * parámetro se comporta como mutable legítimo.
 */
function animateScale(scale: SharedValue<number>, target: number, duration: number) {
  'worklet';
  scale.value = withTiming(target, { duration, easing: EASE_STD });
}

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
  const { colors } = useAppTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion() ?? false;
  const inactive = disabled || loading;

  const styles = useMemo(() => StyleSheet.create({
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
      borderColor: colors.primary,
    },
    label: {
      fontFamily: fonts.body,
      fontWeight: '600',
      fontSize: 16,
    },
  }), [colors]);

  const bg = bgByVariant(colors);
  const text = textByVariant(colors);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Handlers nombrados que delegan en animateScale (fuera del render).
  const handlePressIn = () => {
    if (reduceMotion) return;
    animateScale(scale, 0.97, durations.d1);
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    animateScale(scale, 1, durations.d2);
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          haptics.light();
          onPress();
        }}
        style={[
          styles.base,
          {
            backgroundColor: inactive
              ? colors.primaryDisabledBg
              : bg[variant],
          },
          variant === 'ghost' && !inactive && styles.ghostBorder,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={text[variant]} />
        ) : (
          <>
            {leftIcon}
            <Text
              style={[
                styles.label,
                {
                  color: inactive ? colors.primaryDisabledText : text[variant],
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

export type ThemeColors = Theme['palette'];
