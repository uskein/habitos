import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';
import { useMilestones } from '@/features/milestones/useMilestones';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { AppBar } from '@/ui/navigation/AppBar';
import { ClayButton } from '@/ui/primitives/ClayButton';

const openViewer = () => router.push('/(modals)/hitos-viewer');

/** Lista de hitos — HU-17/18 · BP 14 · back R10. */
export default function HitosListScreen() {
  const milestones = useMilestones();

  if (milestones.isPending) {
    return (
      <View style={styles.screen}>
        <AppBar title="Hitos" onBack={() => router.back()} />
        <View style={styles.body}>
          <Skeleton height={88} borderRadius={24} />
          <Skeleton height={88} borderRadius={24} />
          <Skeleton height={88} borderRadius={24} />
        </View>
      </View>
    );
  }

  if (milestones.isError) {
    return (
      <View style={styles.screen}>
        <AppBar title="Hitos" onBack={() => router.back()} />
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

  return (
    <View style={styles.screen}>
      <AppBar
        title="Hitos"
        onBack={() => router.back()}
        rightAction={
          list.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver hitos como tarjetas"
              onPress={openViewer}
              hitSlop={8}
              style={styles.viewModeBtn}
            >
              <Ionicons name="albums" size={22} color={palette.primary} />
            </Pressable>
          ) : null
        }
      />
      {list.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            title="Aún no tienes hitos"
            description="Celebra tus grandes momentos y cuéntalos a tus hábitos y metas."
            blob="◈"
            action={
              <ClayButton
                label="Crear hito"
                onPress={() => router.push('/(modals)/new-hito')}
              />
            }
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <ClayButton
            label="🎞 Ver como tarjetas"
            variant="secondary"
            onPress={openViewer}
          />
          {list.map((m, i) => (
            <Animated.View key={m.id} entering={FadeIn.delay(i * 40).duration(220)}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Hito ${m.title}`}
                onPress={() => router.push({ pathname: '/hito/[id]', params: { id: m.id } })}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                {m.images[0] ? (
                  <Image source={{ uri: m.images[0].uri }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Text style={styles.thumbGlyph}>◈</Text>
                  </View>
                )}
                <View style={styles.rowTexts}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {m.title}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {m.occurredAt} · {m.links.length} ligazón{m.links.length === 1 ? '' : 'es'}
                    {m.images.length > 0 ? ` · ${m.images.length} foto${m.images.length === 1 ? '' : 's'}` : ''}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Animated.View>
          ))}
          <ClayButton
            label="Nuevo hito"
            variant="secondary"
            onPress={() => router.push('/(modals)/new-hito')}
            style={styles.fab}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  rowPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: palette.surfaceAlt,
  },
  thumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlyph: {
    fontSize: 22,
    color: palette.primary,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 16,
    color: palette.text,
  },
  rowMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
  },
  chevron: {
    fontSize: 24,
    color: palette.textMuted,
    paddingRight: 4,
  },
  viewModeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    marginTop: spacing.sm,
  },
});
