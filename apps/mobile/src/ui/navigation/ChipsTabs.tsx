import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';
import { useHaptics } from '@/hooks/useHaptics';

export interface ChipsTabsProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
}

/** Chips-tabs horizontales — pill, activo primary/white. */
export function ChipsTabs<T extends string>({ options, value, onChange, labels }: ChipsTabsProps<T>) {
  const haptics = useHaptics();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              haptics.selection();
              onChange(opt);
            }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {labels?.[opt] ?? opt}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 14,
    color: palette.textMuted,
  },
  labelActive: {
    color: palette.surface,
  },
});
