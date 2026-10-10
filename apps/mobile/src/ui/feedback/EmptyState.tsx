import { StyleSheet, Text, View } from 'react-native';
import { fonts, palette, spacing } from '@/core/theme/theme';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Glyph emoji o Ionicon renderizado por el caller */
  blob?: string;
  action?: React.ReactNode;
}

/** Empty state con blob clay + copy empática (estilo manual). */
export function EmptyState({ title, description, blob = '◌', action }: EmptyStateProps) {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={styles.blob}>
        <Text style={styles.blobGlyph}>{blob}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  blob: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  blobGlyph: {
    fontSize: 40,
    color: palette.primary,
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 18,
    color: palette.text,
    textAlign: 'center',
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
  },
});
