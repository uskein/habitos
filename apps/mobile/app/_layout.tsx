import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { palette } from '@/core/theme/theme';
import { CelebrationWatcher } from '@/features/achievements/CelebrationWatcher';
import { SessionGate } from '@/features/settings/SessionGate';
import { Spinner } from '@/ui/feedback/Spinner';
import { ToastProvider } from '@/ui/feedback/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Sora: require('../assets/fonts/Sora-Variable.ttf'),
    'Plus Jakarta Sans': require('../assets/fonts/PlusJakartaSans-Variable.ttf'),
    'JetBrains Mono': require('../assets/fonts/JetBrainsMono-Variable.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            <SessionGate>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: palette.bg },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="showcase" options={{ presentation: 'modal', title: 'Design System' }} />
                <Stack.Screen name="(modals)/new-habit" options={{ presentation: 'formSheet' }} />
                <Stack.Screen name="(modals)/new-goal" options={{ presentation: 'formSheet' }} />
                <Stack.Screen name="(modals)/check-in" options={{ presentation: 'formSheet' }} />
                <Stack.Screen name="(modals)/change-pin" options={{ presentation: 'formSheet' }} />
                <Stack.Screen name="(modals)/edit-profile" options={{ presentation: 'formSheet' }} />
                <Stack.Screen name="goal/[id]" />
                <Stack.Screen name="habit/[id]" />
              </Stack>
              <CelebrationWatcher />
            </SessionGate>
          </ToastProvider>
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
