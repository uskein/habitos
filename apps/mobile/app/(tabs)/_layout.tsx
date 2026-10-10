import { Tabs } from 'expo-router';
import { type ColorValue, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { components, palette } from '@/core/theme/theme';

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return (
    <Text style={{ fontSize: components.tabIcon, color }}>{glyph}</Text>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          height: components.tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
        },
        sceneStyle: {
          paddingTop: insets.top,
          backgroundColor: palette.bg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ color }) => <TabIcon glyph="◉" color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color }) => <TabIcon glyph="▤" color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Logros',
          tabBarIcon: ({ color }) => <TabIcon glyph="★" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabIcon glyph="☺" color={color} />,
        }}
      />
    </Tabs>
  );
}
