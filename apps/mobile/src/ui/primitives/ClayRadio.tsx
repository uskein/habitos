import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { components } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';

export interface ClayRadioProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
  disabled?: boolean;
}

const SIZE = components.checkbox;

/** Radio 24×24 — punto primary con pop clay. */
export function ClayRadio({ selected, onSelect, label, disabled }: ClayRadioProps) {
  const { colors } = useAppTheme();
  const haptics = useHaptics();

  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    circle: {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    circleSelected: {
      borderColor: colors.primary,
    },
    dot: {
      width: SIZE / 2,
      height: SIZE / 2,
      borderRadius: SIZE / 4,
      backgroundColor: colors.primary,
    },
    label: {
      color: colors.text,
      fontSize: 15,
      fontFamily: 'Plus Jakarta Sans',
    },
  }), [colors]);

  const dot = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(selected ? 1 : 0, { damping: 12, stiffness: 220 }) },
    ],
  }));

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.selection();
        onSelect();
      }}
      style={[styles.row, disabled && { opacity: 0.5 }]}
    >
      <Animated.View style={[styles.circle, selected && styles.circleSelected]}>
        <Animated.View style={[styles.dot, dot]} />
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
