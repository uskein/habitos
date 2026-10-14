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
import { fonts, radii, shadows, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';

export type ToastTone = 'neutral' | 'success' | 'error';

/** Acción opcional del toast (M30 · p. ej. «Deshacer» tras marcar hábito). */
export interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastState {
  message: string;
  tone: ToastTone;
  action?: ToastAction;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast requiere <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, tone: ToastTone = 'neutral', action?: ToastAction) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, tone, action });
      // Con acción (p. ej. Deshacer) extendemos la ventana de toque.
      timer.current = setTimeout(() => setToast(null), action ? 5000 : 3200);
    },
    [],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const toneColor = useMemo(
    (): Record<ToastTone, string> => ({
      neutral: colors.text,
      success: colors.success,
      error: colors.error,
    }),
    [colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          backgroundColor: colors.surface,
          borderRadius: radii.pill,
          borderWidth: 1,
          borderColor: colors.border,
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
        toastRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        actionBtn: {
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceAlt,
        },
        actionLabel: {
          fontFamily: fonts.body,
          fontWeight: '700',
          fontSize: 13,
          color: colors.primary,
        },
      }),
    [colors],
  );

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
              <View style={styles.toastRow}>
                <Text style={[styles.message, { color: toneColor[toast.tone] }]}>
                  {toast.message}
                </Text>
                {toast.action ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={toast.action.label}
                    hitSlop={8}
                    onPress={() => {
                      const run = toast.action?.onPress;
                      setToast(null);
                      run?.();
                    }}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionLabel}>{toast.action.label}</Text>
                  </Pressable>
                ) : null}
              </View>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
      {children}
    </ToastContext.Provider>
  );
}
