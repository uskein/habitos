import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette, radii, shadows, spacing } from '@/core/theme/theme';

export interface ClayCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  onPress?: () => void;
}

/** Card clay r24 — surface blanca, borde sutil, sombra suave. */
export function ClayCard({ children, style, elevated = true, onPress }: ClayCardProps) {
  const card = (
    <View style={[styles.card, elevated && shadows.clay, style]}>{children}</View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }}
      >
        {card}
      </Pressable>
    );
  }
  return card;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
  },
});
