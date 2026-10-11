import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, radii, shadows, spacing } from '@/core/theme/theme';
import { useHaptics } from '@/hooks/useHaptics';

export interface ChipsTabsProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
}

/** Chips-tabs horizontales — segmented control: track surfaceAlt + píldora
 *  activa elevada (surface + sombra fab + texto primary bold). */
export function ChipsTabs<T extends string>({ options, value, onChange, labels }: ChipsTabsProps<T>) {
  const haptics = useHaptics();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      <View style={styles.track}>
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
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>
                {labels?.[opt] ?? opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    padding: 4,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: palette.surface,
    ...shadows.fab,
  },
  chipPressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 14,
    color: palette.textMuted,
  },
  labelActive: {
    color: palette.primary,
    fontWeight: '700',
  },
});
