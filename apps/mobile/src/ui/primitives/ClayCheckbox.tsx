import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useReducedMotion, withSpring } from 'react-native-reanimated';
import { components, radii } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';

export interface ClayCheckboxProps {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}

const SIZE = components.checkbox;

/** Checkbox 24×24 r8 — check pop con spring clay. */
export function ClayCheckbox({ checked, onCheckedChange, disabled, label }: ClayCheckboxProps) {
  const { colors } = useAppTheme();
  const haptics = useHaptics();
  const reduceMotion = useReducedMotion() ?? false;

  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    box: {
      width: SIZE,
      height: SIZE,
      borderRadius: radii.sm,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    label: {
      color: colors.text,
      fontSize: 15,
    },
  }), [colors]);

  const pop = useAnimatedStyle(() => {
    const v = checked ? 1 : 0;
    if (reduceMotion) return { transform: [{ scale: v }], opacity: v };
    return {
      transform: [{ scale: withSpring(v, { damping: 12, stiffness: 220 }) }],
      opacity: withSpring(v),
    };
  });

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.selection();
        onCheckedChange(!checked);
      }}
      style={[styles.row, disabled && { opacity: 0.5 }]}
    >
      <Animated.View
        style={[
          styles.box,
          { backgroundColor: checked ? colors.primary : colors.surface },
          pop,
        ]}
      >
        <Animated.View style={pop}>
            <Ionicons name="checkmark" size={16} color={colors.surface} />
        </Animated.View>
      </Animated.View>
      {label ? <Animated.Text style={styles.label}>{label}</Animated.Text> : null}
    </Pressable>
  );
}
