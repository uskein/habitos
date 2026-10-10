import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { components, fonts, palette, spacing } from '@/core/theme/theme';

export interface AppBarProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

/** Top App Bar — back icono 44×44, título display, safe-area superior. */
export function AppBar({ title, onBack, rightAction }: AppBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.iconBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.iconBtn}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: palette.bg,
  },
  iconBtn: {
    width: components.iconButton,
    height: components.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 17,
    color: palette.text,
  },
});
