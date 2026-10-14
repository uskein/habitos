import { router } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import type { MilestoneWithMedia } from '@/core/domain/entities/milestone';
import {
  badgeTints,
  fonts,
  radii,
  shadows,
  spacing,
  veils,
} from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import { useMilestones } from '@/features/milestones/useMilestones';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { ClayButton } from '@/ui/primitives/ClayButton';

const openDetail = (id: string) => router.push({ pathname: '/hito/[id]', params: { id } });

function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function isRecent(iso: string): boolean {
  const t = new Date(iso + 'T00:00:00').getTime();
  return Number.isFinite(t) && Date.now() - t <= 30 * 864e5;
}

/** Top Hitos — V2.2 tab: galería creativa (hero del más reciente + grid) con detalle HU-18. */
export default function TopHitosScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.bg,
        },
        body: {
          padding: spacing.lg,
          gap: spacing.md,
          paddingBottom: 48,
        },
        center: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        headerTexts: {
          flex: 1,
          gap: 2,
        },
        title: {
          fontFamily: fonts.display,
          fontWeight: '800',
          fontSize: 28,
          color: colors.text,
        },
        subtitle: {
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.textMuted,
        },
        countPill: {
          backgroundColor: badgeTints.purple.bg,
          borderRadius: radii.pill,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        countPillText: {
          fontFamily: fonts.display,
          fontWeight: '700',
          fontSize: 14,
          color: badgeTints.purple.text,
        },
        hero: {
          height: 260,
          borderRadius: 32,
          overflow: 'hidden',
          backgroundColor: colors.primary,
          justifyContent: 'flex-end',
        },
        heroImg: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        },
        heroFallback: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
        heroFallbackGlyph: {
          fontSize: 88,
          color: veils.light,
        },
        heroShade: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: veils.dark,
        },
        heroBadge: {
          position: 'absolute',
          top: 14,
          left: 14,
          backgroundColor: badgeTints.success.bg,
          borderRadius: radii.pill,
          paddingHorizontal: 12,
          paddingVertical: 5,
        },
        heroBadgeText: {
          fontFamily: fonts.body,
          fontWeight: '700',
          fontSize: 12,
          color: badgeTints.success.text,
        },
        heroTexts: {
          padding: spacing.lg,
          gap: 6,
        },
        heroKicker: {
          fontFamily: fonts.mono,
          fontSize: 11,
          letterSpacing: 1.5,
          color: colors.surface,
        },
        heroTitle: {
          fontFamily: fonts.display,
          fontWeight: '800',
          fontSize: 24,
          color: colors.surface,
        },
        heroFooter: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        heroDate: {
          fontFamily: fonts.mono,
          fontSize: 13,
          color: colors.surface,
        },
        heroCta: {
          fontFamily: fonts.body,
          fontWeight: '700',
          fontSize: 14,
          color: colors.surface,
        },
        sectionLabel: {
          fontFamily: fonts.display,
          fontWeight: '700',
          fontSize: 16,
          color: colors.text,
          marginTop: spacing.xs,
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: spacing.md,
        },
        gridItem: {
          width: '48%',
        },
        card: {
          gap: 8,
        },
        pressed: {
          opacity: 0.85,
          transform: [{ scale: 0.98 }],
        },
        thumbWrap: {
          width: '100%',
          aspectRatio: 1,
          borderRadius: radii.lg,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        thumb: {
          width: '100%',
          height: '100%',
        },
        thumbEmpty: {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceAlt,
        },
        thumbGlyph: {
          fontSize: 44,
          color: colors.primary,
        },
        dateChip: {
          position: 'absolute',
          bottom: 8,
          left: 8,
          backgroundColor: veils.dark,
          borderRadius: radii.pill,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        dateChipText: {
          fontFamily: fonts.mono,
          fontSize: 11,
          color: colors.surface,
        },
        cardTitle: {
          fontFamily: fonts.display,
          fontWeight: '700',
          fontSize: 14,
          color: colors.text,
        },
        cardMeta: {
          fontFamily: fonts.body,
          fontSize: 11,
          color: colors.textMuted,
        },
      }),
    [colors],
  );
  const milestones = useMilestones();

  if (milestones.isPending) {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Skeleton height={64} borderRadius={24} />
          <Skeleton height={260} borderRadius={32} />
          <View style={styles.grid}>
            <Skeleton height={200} borderRadius={24} width="48%" />
            <Skeleton height={200} borderRadius={24} width="48%" />
          </View>
        </View>
      </View>
    );
  }

  if (milestones.isError) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <EmptyState
            title="No se pudieron cargar los hitos"
            description="Error leyendo la base local."
            blob="⚠"
            action={<ClayButton label="Reintentar" onPress={() => void milestones.refetch()} />}
          />
        </View>
      </View>
    );
  }

  const list = milestones.data ?? [];

  if (list.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <EmptyState
            title="Aún no hay hitos"
            description="Celebra tus grandes momentos y verás tu galería cobrar vida."
            blob="◈"
            action={
              <ClayButton label="Crear hito" onPress={() => router.push('/(modals)/new-hito')} />
            }
          />
        </View>
      </View>
    );
  }

  const hero = list[0]!;
  const rest = list.slice(1);
  const photos = (m: MilestoneWithMedia) => m.images.length;
  const links = (m: MilestoneWithMedia) => m.links.length;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(240)} style={styles.header}>
          <View style={styles.headerTexts}>
            <Text style={styles.title}>Top Hitos</Text>
            <Text style={styles.subtitle}>
              {list.length} {list.length === 1 ? 'logrado' : 'logrados'} · tu galería de momentos
            </Text>
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{list.length} ◈</Text>
          </View>
        </Animated.View>

        {/* Hero — hito más reciente */}
        <Animated.View entering={FadeInDown.duration(320)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Hito más reciente: ${hero.title}. Toca para ver el detalle.`}
            onPress={() => openDetail(hero.id)}
            style={({ pressed }) => [
              styles.hero,
              shadows.clay,
              pressed && styles.pressed,
            ]}
          >
            {hero.images[0] ? (
              <Image source={{ uri: hero.images[0].uri }} style={styles.heroImg} />
            ) : (
              <View style={styles.heroFallback}>
                <Text style={styles.heroFallbackGlyph}>◈</Text>
              </View>
            )}
            <View style={styles.heroShade} />
            {isRecent(hero.occurredAt) ? (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>¡Nuevo!</Text>
              </View>
            ) : null}
            <View style={styles.heroTexts}>
              <Text style={styles.heroKicker}>MÁS RECIENTE</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {hero.title}
              </Text>
              <View style={styles.heroFooter}>
                <Text style={styles.heroDate}>{shortDate(hero.occurredAt)}</Text>
                <Text style={styles.heroCta}>Ver detalle ›</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {rest.length > 0 ? <Text style={styles.sectionLabel}>Galería</Text> : null}

        <View style={styles.grid}>
          {rest.map((m, i) => (
            <Animated.View
              key={m.id}
              entering={FadeInDown.delay(80 + i * 50).duration(280)}
              style={styles.gridItem}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Hito ${m.title}, ${shortDate(m.occurredAt)}. Toca para ver el detalle.`}
                onPress={() => openDetail(m.id)}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.thumbWrap}>
                  {m.images[0] ? (
                    <Image source={{ uri: m.images[0].uri }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbEmpty]}>
                      <Text style={styles.thumbGlyph}>◈</Text>
                    </View>
                  )}
                  <View style={styles.dateChip}>
                    <Text style={styles.dateChipText}>{shortDate(m.occurredAt)}</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {m.title}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {photos(m)} foto{photos(m) === 1 ? '' : 's'} · {links(m)} ligazón
                  {links(m) === 1 ? '' : 'es'}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <ClayButton
          label="Nuevo hito"
          variant="secondary"
          onPress={() => router.push('/(modals)/new-hito')}
        />
      </ScrollView>
    </View>
  );
}

