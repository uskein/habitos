import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, palette, spacing } from '@/core/theme/theme';
import { useMilestones } from '@/features/milestones/useMilestones';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { SwipeCard } from '@/ui/primitives/SwipeCard';

/**
 * Ventanita ver hitos como tarjetas (V2 · petición Paso 5) — deck estilo
 * motivaciones: arrastra → / ← para navegar, foto real, contador y atajo a
 * detalle. Se abre desde la lista de hitos (formSheet).
 */
export default function HitosViewerSheet() {
  const milestones = useMilestones();
  const [index, setIndex] = useState(0);

  if (milestones.isPending) {
    return (
      <View style={styles.body}>
        <Skeleton height={400} borderRadius={24} />
      </View>
    );
  }

  const list = milestones.data ?? [];

  if (milestones.isError || list.length === 0) {
    return (
      <View style={styles.body}>
        <Text style={styles.title}>Tus hitos</Text>
        <EmptyState
          title={milestones.isError ? 'No se pudieron cargar' : 'Aún no tienes hitos'}
          description={
            milestones.isError
              ? 'Error leyendo la base local.'
              : 'Celebra tu primer gran momento y aparecerá aquí.'
          }
          blob={milestones.isError ? '⚠' : '◈'}
          action={
            milestones.isError ? (
              <ClayButton label="Reintentar" onPress={() => void milestones.refetch()} />
            ) : undefined
          }
        />
      </View>
    );
  }

  const safeIndex = Math.min(index, list.length - 1);
  const current = list[safeIndex];
  if (!current) return null;
  const photos = current.images.length;
  const go = (delta: number) =>
    setIndex((i) => (i + delta + list.length) % list.length);

  return (
    <View style={styles.body}>
      <View style={styles.header}>
        <Text style={styles.title}>Tus hitos</Text>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {safeIndex + 1}/{list.length}
          </Text>
        </View>
      </View>

      <SwipeCard
        key={current.id}
        imageUri={current.images[0]?.uri}
        emoji="◈"
        title={current.title}
        subtitle={`${current.occurredAt}${photos > 0 ? ` · ${photos} foto${photos === 1 ? '' : 's'}` : ''}`}
        onGuardar={() => go(1)}
        onDescartar={() => go(-1)}
        stampSave="SIGUIENTE →"
        stampDiscard="← ANTERIOR"
        saveGlyph="›"
        discardGlyph="‹"
        hint="Arrastra → siguiente · ← anterior"
        saveLabel="Siguiente hito"
        discardLabel="Hito anterior"
        height={400}
      />

      <View style={styles.footer}>
        <ClayButton
          label="Ver detalle"
          variant="secondary"
          onPress={() => router.push({ pathname: '/hito/[id]', params: { id: current.id } })}
        />
        <ClayButton label="Cerrar" variant="ghost" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 22,
    color: palette.text,
  },
  counter: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  counterText: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 13,
    color: palette.primary,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
