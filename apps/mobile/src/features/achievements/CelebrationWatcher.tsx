import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { badgeTints, fonts, radii, shadows, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import { useAchievements } from './useAchievements';

interface FreshUnlock {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const AUTO_DISMISS_MS = 4000;

/**
 * Celebración no bloqueante (R5, HU-13): modal 4 s con CTA → Logros.
 * Observa la caché de medallas; solo celebra unlocks NUEVOS tras la primera carga.
 */
export function CelebrationWatcher() {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: 'rgba(23,18,43,0.45)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        },
        card: {
          width: '100%',
          maxWidth: 340,
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing.lg,
          alignItems: 'center',
          gap: spacing.sm,
        },
        kicker: {
          fontFamily: fonts.body,
          fontWeight: '600',
          fontSize: 12,
          color: badgeTints.warning.text,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        medal: {
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: colors.awardSoft,
          borderWidth: 2,
          borderColor: colors.award,
          alignItems: 'center',
          justifyContent: 'center',
        },
        icon: {
          fontSize: 42,
        },
        title: {
          fontFamily: fonts.display,
          fontWeight: '700',
          fontSize: 20,
          color: colors.text,
          textAlign: 'center',
        },
        desc: {
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.textMuted,
          textAlign: 'center',
        },
        actions: {
          gap: spacing.sm,
          alignItems: 'center',
          marginTop: spacing.xs,
        },
        cta: {
          backgroundColor: colors.primary,
          borderRadius: radii.pill,
          paddingHorizontal: 32,
          paddingVertical: 14,
        },
        ctaText: {
          fontFamily: fonts.body,
          fontWeight: '600',
          fontSize: 15,
          color: colors.surface,
        },
        later: {
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.textMuted,
          paddingVertical: 4,
        },
      }),
    [colors],
  );
  const { data } = useAchievements();
  const known = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<FreshUnlock | null>(null);

  useEffect(() => {
    if (!data) return;
    const ids = new Set(data.unlocked.map((u) => u.achievementId));
    if (known.current === null) {
      known.current = ids;
      return;
    }
    const newest = data.unlocked.find((u) => !known.current!.has(u.achievementId));
    known.current = ids;
    if (!newest) return;
    const cat = data.catalog.find((a) => a.id === newest.achievementId);
    if (cat) {
      setFresh({ id: cat.id, icon: cat.icon, title: cat.title, description: cat.description });
    }
  }, [data]);

  useEffect(() => {
    if (!fresh) return;
    const t = setTimeout(() => setFresh(null), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [fresh]);

  if (!fresh) return null;

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent onRequestClose={() => setFresh(null)}>
      <Animated.View entering={FadeIn.duration(120)} style={styles.backdrop}>
        <Animated.View entering={ZoomIn.duration(320)} style={[styles.card, shadows.clay]}>
          <Text style={styles.kicker}>¡Medalla desbloqueada!</Text>
          <View style={styles.medal}>
            <Text style={styles.icon}>{fresh.icon}</Text>
          </View>
          <Text style={styles.title}>{fresh.title}</Text>
          <Text style={styles.desc}>{fresh.description}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setFresh(null);
                router.push('/(tabs)/achievements');
              }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Ver logros</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setFresh(null)} hitSlop={8}>
              <Text style={styles.later}>Seguir</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

