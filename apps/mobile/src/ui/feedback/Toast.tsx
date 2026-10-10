import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { fonts, palette, radii, shadows, spacing } from '@/core/theme/theme';

export type ToastTone = 'neutral' | 'success' | 'error';

interface ToastState {
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast requiere <ToastProvider>');
  return ctx;
}

const toneColor: Record<ToastTone, string> = {
  neutral: palette.text,
  success: palette.success,
  error: palette.error,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, tone: ToastTone = 'neutral') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, tone });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.host} pointerEvents="box-none">
        {toast ? (
          <Animated.View entering={FadeInUp.duration(240)} exiting={FadeOutUp.duration(180)}>
            <Pressable
              accessibilityRole="alert"
              onPress={() => setToast(null)}
              style={[styles.toast, shadows.clay]}
            >
              <Text style={[styles.message, { color: toneColor[toast.tone] }]}>
                {toast.message}
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
      {children}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 72,
    pointerEvents: 'box-none',
  },
  toast: {
    backgroundColor: palette.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    maxWidth: '86%',
  },
  message: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});
