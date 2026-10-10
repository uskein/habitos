import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useReducedMotion, withSpring } from 'react-native-reanimated';
import { components, durations, easings, palette, radii } from '@/core/theme/theme';
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
  const haptics = useHaptics();
  const reduceMotion = useReducedMotion() ?? false;

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
          { backgroundColor: checked ? palette.primary : palette.surface },
          pop,
        ]}
      >
        <Animated.View style={pop}>
            <Ionicons name="checkmark" size={16} color={palette.surface} />
        </Animated.View>
      </Animated.View>
      {label ? <Animated.Text style={styles.label}>{label}</Animated.Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    color: palette.text,
    fontSize: 15,
  },
});
