import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { HabitWithLog } from '@/core/domain/entities/habit';
import { badgeTints, durations, easings, fonts, radii, shadows, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';

export interface HabitCardProps {
  habit: HabitWithLog;
  onToggle: () => void;
  disabled?: boolean;
}

const EASE_STD = Easing.bezier(...(easings.std as [number, number, number, number]));

/**
 * R8 (reduce-motion): estados inmediatos en los shared values, sin «+1 🔥»
 * animado. Fuera del cuerpo del componente para que react-hooks/immutability
 * del compiler trate la asignación a `.value` como mutable legítimo (ver ClayButton).
 */
function applyToggleMotion(
  checkPop: SharedValue<number>,
  scale: SharedValue<number>,
  floatY: SharedValue<number>,
  next: boolean,
) {
  'worklet';
  checkPop.value = next ? 1 : 0;
  scale.value = 1;
  floatY.value = 0;
}

/** Reinicia el flotante a su posición base. Ver applyToggleMotion sobre inmutabilidad. */
function resetFloatY(floatY: SharedValue<number>) {
  'worklet';
  floatY.value = 0;
}

/** Pop ease-clay del check + flotante «+1 🔥». Ver applyToggleMotion sobre inmutabilidad. */
function applyToggleAnimation(
  checkPop: SharedValue<number>,
  scale: SharedValue<number>,
  floatY: SharedValue<number>,
  next: boolean,
) {
  'worklet';
  scale.value = withSequence(
    withTiming(0.97, { duration: durations.d1 }),
    withSpring(1, { damping: 14, stiffness: 260 }),
  );
  checkPop.value = withSpring(next ? 1 : 0, { damping: 11, stiffness: 240 });

  if (next) {
    floatY.value = withSequence(
      withTiming(-18, { duration: durations.d3, easing: EASE_STD }),
      withTiming(-26, { duration: durations.d2 }),
    );
  } else {
    floatY.value = 0;
  }
}

/** HabitCard — icono clay + check 32 px, pop ease-clay y «+1 🔥» flotante (R8: sin motion si reduce-motion). */
export function HabitCard({ habit, onToggle, disabled = false }: HabitCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          position: 'relative',
        },
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: 14,
          ...shadows.clay,
        },
        cardDone: {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.primary,
        },
        left: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          flex: 1,
        },
        iconBox: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
        },
        icon: {
          fontSize: 22,
        },
        texts: {
          flex: 1,
          gap: 2,
        },
        name: {
          fontFamily: fonts.body,
          fontWeight: '600',
          fontSize: 16,
          color: colors.text,
        },
        nameDone: {
          color: colors.textMuted,
          textDecorationLine: 'line-through',
        },
        meta: {
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textMuted,
        },
        check: {
          width: 32,
          height: 32,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        },
        checkOn: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        checkInner: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        checkMark: {
          color: colors.surface,
          fontSize: 16,
          fontWeight: '700',
        },
        plusOne: {
          position: 'absolute',
          right: 18,
          top: -6,
          fontFamily: fonts.mono,
          fontWeight: '700',
          fontSize: 14,
          color: badgeTints.danger.text,
        },
      }),
    [colors],
  );
  const haptics = useHaptics();
  const reduceMotion = useReducedMotion() ?? false;
  const [showPlusOne, setShowPlusOne] = useState(false);
  const plusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const done = habit.log?.completed ?? false;
  const scale = useSharedValue(1);
  const checkPop = useSharedValue(done ? 1 : 0);
  const floatY = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkPop.value }],
    opacity: checkPop.value,
  }));
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
    opacity: floatY.value < 0 ? 1 : 0,
  }));

  const press = () => {
    if (disabled) return;
    haptics.success();

    const next = !done;

    if (reduceMotion) {
      // R8: estados inmediatos, sin «+1 🔥» animado
      applyToggleMotion(checkPop, scale, floatY, next);
      setShowPlusOne(false);
      onToggle();
      return;
    }

    applyToggleAnimation(checkPop, scale, floatY, next);

    if (next) {
      setShowPlusOne(true);
      if (plusTimer.current) clearTimeout(plusTimer.current);
      plusTimer.current = setTimeout(() => {
        setShowPlusOne(false);
        resetFloatY(floatY);
      }, 900);
    } else {
      resetFloatY(floatY);
      setShowPlusOne(false);
    }

    onToggle();
  };

  return (
    <Animated.View style={[styles.wrap, cardStyle]}>
      <Pressable
        onPress={press}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled }}
        accessibilityLabel={`${habit.name}, ${done ? 'completado' : 'pendiente'}`}
        style={[styles.card, done && styles.cardDone]}
      >
        <View style={styles.left}>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={styles.icon}>{habit.icon}</Text>
          </View>
          <View style={styles.texts}>
            <Text style={[styles.name, done && styles.nameDone]} numberOfLines={1}>
              {habit.name}
            </Text>
            <Text style={styles.meta}>
              {habit.category === 'meta' && habit.targetValue
                ? `Meta: ${habit.targetValue} ${habit.unit ?? ''}`.trim()
                : habit.category === 'bienestar'
                  ? 'Bienestar'
                  : 'Hábito'}
            </Text>
          </View>
        </View>

        <View style={[styles.check, done && styles.checkOn]}>
          <Animated.View style={[styles.checkInner, checkStyle]}>
            <Text style={styles.checkMark}>✓</Text>
          </Animated.View>
        </View>
      </Pressable>

      {showPlusOne && (
        <Animated.Text entering={FadeInUp.duration(180)} style={[styles.plusOne, floatStyle]}>
          +1 🔥
        </Animated.Text>
      )}
    </Animated.View>
  );
}

