import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';
import { useMilestonesByEntity } from './useMilestones';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { ClayButton } from '@/ui/primitives/ClayButton';

export interface MilestoneSectionProps {
  entityType: 'habit' | 'goal';
  entityId: string;
}

/**
 * Sección hitos en detalle de hábito/meta — HU-18 acceso cruzado (BP 13).
 * Lista los hitos ligados + atajo a crear uno nuevo con la liga prefilled.
 */
export function MilestoneSection({ entityType, entityId }: MilestoneSectionProps) {
  const milestones = useMilestonesByEntity(entityType, entityId);

  const openNew = () =>
    router.push({
      pathname: '/(modals)/new-hito',
      params: entityType === 'habit' ? { habitId: entityId } : { goalId: entityId },
    });

  if (milestones.isPending) {
    return (
      <View style={styles.wrap}>
        <Skeleton height={64} borderRadius={20} />
        <Skeleton height={64} borderRadius={20} />
      </View>
    );
  }

  const list = milestones.data ?? [];

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Hitos</Text>
        <ClayButton label="+ Añadir" variant="ghost" onPress={openNew} />
      </View>
      {milestones.isError ? (
        <Pressable onPress={() => void milestones.refetch()} style={styles.errorRow}>
          <Text style={styles.errorText}>No se pudieron cargar los hitos — toca para reintentar</Text>
        </Pressable>
      ) : list.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>Sin hitos todavía. Celebra tu primer gran momento.</Text>
          <ClayButton label="Crear hito" variant="secondary" onPress={openNew} />
        </View>
      ) : (
        list.map((m) => (
          <Pressable
            key={m.id}
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
              <Text style={styles.rowMeta}>{m.occurredAt}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))
      )}
      {list.length > 0 ? (
        <ClayButton label="Ver todos los hitos" variant="ghost" onPress={() => router.push('/hitos')} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 16,
    color: palette.text,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.sm + 2,
  },
  rowPressed: {
    opacity: 0.85,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceAlt,
  },
  thumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlyph: {
    fontSize: 18,
    color: palette.primary,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 15,
    color: palette.text,
  },
  rowMeta: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: palette.textMuted,
  },
  chevron: {
    fontSize: 20,
    color: palette.textMuted,
    paddingRight: 4,
  },
  emptyRow: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textMuted,
  },
  errorRow: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.error,
  },
});
