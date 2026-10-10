import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { HabitWithLog } from '@/core/domain/entities/habit';
import { components, durations, easings, fonts, palette, radii, shadows, spacing } from '@/core/theme/theme';
import { useHaptics } from '@/hooks/useHaptics';

export interface HabitCardProps {
  habit: HabitWithLog;
  onToggle: () => void;
  disabled?: boolean;
}

/** HabitCard — icono clay + check 32 px, pop ease-clay y «+1 🔥» flotante. */
export function HabitCard({ habit, onToggle, disabled = false }: HabitCardProps) {
  const haptics = useHaptics();
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
    scale.value = withSequence(
      withTiming(0.97, { duration: durations.d1 }),
      withSpring(1, { damping: 14, stiffness: 260 }),
    );
    checkPop.value = withSpring(next ? 1 : 0, { damping: 11, stiffness: 240 });

    if (next) {
      floatY.value = withSequence(
        withTiming(-18, { duration: durations.d3, easing: Easing.bezier(...(easings.std as [number, number, number, number])) }),
        withTiming(-26, { duration: durations.d2 }),
      );
      setShowPlusOne(true);
      if (plusTimer.current) clearTimeout(plusTimer.current);
      plusTimer.current = setTimeout(() => {
        setShowPlusOne(false);
        floatY.value = 0;
      }, 900);
    } else {
      floatY.value = 0;
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
          <View style={[styles.iconBox, { backgroundColor: palette.surfaceAlt }]}>
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

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...shadows.clay,
  },
  cardDone: {
    backgroundColor: palette.surfaceAlt,
    borderColor: palette.primary,
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
    color: palette.text,
  },
  nameDone: {
    color: palette.textMuted,
    textDecorationLine: 'line-through',
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  checkOn: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  checkInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: palette.surface,
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
    color: palette.streak,
  },
});
