import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { components, fonts, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';

export interface AppBarProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

/** Top App Bar — back icono 44×44, título display, safe-area superior. */
export function AppBar({ title, onBack, rightAction }: AppBarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.sm,
          backgroundColor: colors.bg,
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
          color: colors.text,
        },
      }),
    [colors],
  );

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
          <Ionicons name="chevron-back" size={24} color={colors.text} />
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
