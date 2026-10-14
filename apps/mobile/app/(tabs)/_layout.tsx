import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { components } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';

type TabGlyph = keyof typeof Ionicons.glyphMap;

/** Icono de tab con pill clay: activo → primary sobre primarySoft, inactivo → muted. */
function TabIcon({ name, focused }: { name: TabGlyph; focused: boolean }) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          minWidth: 56,
          height: 30,
          paddingHorizontal: 12,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        },
        wrapActive: {
          backgroundColor: colors.primarySoft,
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.wrap, focused && styles.wrapActive]}>
      <Ionicons
        name={name}
        size={20}
        color={focused ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: components.tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        sceneStyle: {
          paddingTop: insets.top,
          backgroundColor: colors.bg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ focused }) => <TabIcon name="today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ focused }) => <TabIcon name="list" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="top-hitos"
        options={{
          title: 'Top Hitos',
          tabBarIcon: ({ focused }) => <TabIcon name="sparkles" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Logros',
          tabBarIcon: ({ focused }) => <TabIcon name="trophy" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon name="person-circle" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
