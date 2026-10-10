import { StyleSheet, Text, View } from 'react-native';
import { badgeTints, fonts, radii } from '@/core/theme/theme';

export type BadgeTint = keyof typeof badgeTints;

export interface BadgeProps {
  label: string;
  tint?: BadgeTint;
}

/** Badge tint pattern — bg claro + texto saturado del mismo tono. */
export function Badge({ label, tint = 'purple' }: BadgeProps) {
  const colors = badgeTints[tint];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 12,
  },
});
