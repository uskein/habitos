import { LIMITS } from '@habitos/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Sharing from 'expo-sharing';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';
import { milestoneShareService } from '@/core/services/milestoneShareService';
import {
  useMilestone,
  useRemoveMilestone,
  useSetMilestoneComment,
} from '@/features/milestones/useMilestones';
import { useHabit } from '@/features/habits/useHabits';
import { useGoal } from '@/features/goals/useGoals';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { ClayBars } from '@/ui/feedback/ClayBars';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { useMilestoneActivity } from '@/features/habits/useStats';
import { useToast } from '@/ui/feedback/Toast';
import { AppBar } from '@/ui/navigation/AppBar';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayCard } from '@/ui/primitives/ClayCard';
import { ClayCarousel } from '@/ui/primitives/ClayCarousel';

/** Detalle de hito — HU-18 · F13 · BP 13 (carrusel, comentario, borrar). */
export default function HitoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const milestone = useMilestone(id);
  const setComment = useSetMilestoneComment();
  const remove = useRemoveMilestone();
  const [draft, setDraft] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  if (milestone.isPending) {
    return (
      <View style={styles.screen}>
        <AppBar title="Hito" onBack={() => router.back()} />
        <View style={styles.body}>
          <Skeleton height={240} borderRadius={24} />
          <Skeleton height={28} width="70%" />
          <Skeleton height={100} borderRadius={24} />
        </View>
      </View>
    );
  }

  if (milestone.isError || !milestone.data) {
    return (
      <View style={styles.screen}>
        <AppBar title="Hito" onBack={() => router.back()} />
        <View style={styles.center}>
          <EmptyState
            title="Hito no encontrado"
            blob="⚠"
            action={<ClayButton label="Volver" variant="secondary" onPress={() => router.back()} />}
          />
        </View>
      </View>
    );
  }

  const m = milestone.data;
  const note = draft ?? m.note ?? '';

  const saveNote = () => {
    setComment.mutate(
      { milestoneId: m.id, note: note.trim() },
      {
        onSuccess: () => {
          setDraft(null);
          toast.show('Comentario guardado', 'success');
        },
        onError: (e) => toast.show(e instanceof Error ? e.message : 'No se pudo guardar', 'error'),
      },
    );
  };

  /** HU-29 · F22 — render 1080×1080 → sheet nativo; fallo → SHARE_RENDER_FAILED + retry. */
  const share = () => {
    setSharing(true);
    setShareError(null);
    void (async () => {
      try {
        const uri = await milestoneShareService.render(m.id);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartir hito' });
        } else {
          toast.show('Compartir no está disponible en este dispositivo', 'error');
        }
      } catch (e) {
        setShareError(e instanceof Error ? e.message : 'No se pudo compartir');
      } finally {
        setSharing(false);
      }
    })();
  };

  const onDelete = () => {
    Alert.alert('Borrar hito', `¿Eliminar «${m.title}»? Se borrarán sus fotos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () =>
          remove.mutate(m.id, {
            onSuccess: () => {
              toast.show('Hito borrado', 'success');
              router.back();
            },
            onError: (e) => toast.show(e instanceof Error ? e.message : 'No se pudo borrar', 'error'),
          }),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <AppBar title="Hito" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(240)}>
          {m.images.length > 0 ? (
            <ClayCarousel height={260} itemLabel={(i, t) => `${i + 1}/${t}`}>
              {m.images.map((img) => (
                <Image key={img.id} source={{ uri: img.uri }} style={styles.photo} resizeMode="cover" />
              ))}
            </ClayCarousel>
          ) : (
            <View style={styles.photoEmpty}>
              <Text style={styles.photoEmptyGlyph}>◈</Text>
            </View>
          )}
        </Animated.View>

        <Text style={styles.title}>{m.title}</Text>
        <Text style={styles.meta}>{m.occurredAt}</Text>

        <ClayCard style={styles.noteCard}>
          <Text style={styles.noteLabel}>Comentario (máx. {LIMITS.MILESTONE_NOTE_MAX})</Text>
          <TextInput
            value={note}
            onChangeText={setDraft}
            maxLength={LIMITS.MILESTONE_NOTE_MAX}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholder="¿Qué recuerdas de ese día?"
            placeholderTextColor={palette.textMuted}
            style={styles.noteInput}
            accessibilityLabel="Comentario del hito"
          />
          <ClayButton
            label="Guardar comentario"
            variant="secondary"
            loading={setComment.isPending}
            disabled={setComment.isPending || note.trim() === (m.note ?? '')}
            onPress={saveNote}
          />
        </ClayCard>

        <ClayCard style={styles.linksCard}>
          <Text style={styles.noteLabel}>Ligado a</Text>
          {m.links.map((l) => (
            <LinkChip key={`${l.entityType}:${l.entityId}`} entityType={l.entityType} entityId={l.entityId} />
          ))}
        </ClayCard>

        <ActivitySection milestoneId={m.id} />

        {shareError && (
          <View style={styles.shareError} accessibilityRole="alert">
            <Text style={styles.shareErrorText}>{shareError}</Text>
            <ClayButton label="Reintentar" variant="secondary" onPress={share} />
          </View>
        )}

        <ClayButton
          label={sharing ? 'Renderizando…' : 'Compartir tarjeta'}
          variant="secondary"
          loading={sharing}
          disabled={sharing || remove.isPending}
          onPress={share}
        />

        <ClayButton
          label="Borrar hito"
          variant="danger"
          loading={remove.isPending}
          disabled={remove.isPending}
          onPress={onDelete}
        />
      </ScrollView>
    </View>
  );
}

/** HU-26 · V2 — actividad de hábito/meta en la semana antes/después del hito. */
function ActivitySection({ milestoneId }: { milestoneId: string }) {
  const activity = useMilestoneActivity(milestoneId);

  if (activity.isPending) return <Skeleton height={110} borderRadius={24} />;
  if (activity.isError) {
    return (
      <ClayCard style={styles.noteCard}>
        <EmptyState
          title="No se pudo calcular la actividad"
          blob="⚠"
          action={<ClayButton label="Reintentar" variant="secondary" onPress={() => void activity.refetch()} />}
        />
      </ClayCard>
    );
  }

  const a = activity.data!;
  const diff = a.after - a.before;

  return (
    <ClayCard style={styles.noteCard}>
      <Text style={styles.noteLabel}>Actividad — semana antes/después del hito</Text>
      <ClayBars
        data={[
          { label: 'Antes', value: a.before },
          { label: 'Después', value: a.after },
        ]}
        height={110}
        accessibilityLabel={`Días con hábitos completados: ${a.before} antes, ${a.after} después`}
      />
      <Text style={styles.activitySummary}>
        {diff > 0
          ? `+${diff} día${diff === 1 ? '' : 's'} de actividad después del hito 🚀`
          : diff === 0
            ? 'La actividad se mantuvo estable'
            : `${diff} día${diff === -1 ? '' : 's'} menos tras el hito`}
      </Text>
    </ClayCard>
  );
}

function LinkChip({ entityType, entityId }: { entityType: 'habit' | 'goal'; entityId: string }) {
  const habit = useHabit(entityType === 'habit' ? entityId : '');
  const goal = useGoal(entityType === 'goal' ? entityId : '');
  const label =
    entityType === 'habit'
      ? `${habit.data?.icon ?? '◌'} ${habit.data?.name ?? '…'}`
      : `🎯 ${goal.data?.title ?? '…'}`;

  return (
    <ClayButton
      label={label}
      variant="secondary"
      onPress={() =>
        router.push(
          entityType === 'habit'
            ? { pathname: '/habit/[id]', params: { id: entityId } }
            : { pathname: '/goal/[id]', params: { id: entityId } },
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
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
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: palette.surfaceAlt,
  },
  photoEmpty: {
    height: 160,
    borderRadius: radii.lg,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmptyGlyph: {
    fontSize: 40,
    color: palette.primary,
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 24,
    color: palette.text,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: palette.textMuted,
    marginTop: -spacing.sm,
  },
  noteCard: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  noteLabel: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 12,
    color: palette.textMuted,
  },
  noteInput: {
    minHeight: 72,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.surfaceAlt,
    padding: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 15,
    color: palette.text,
  },
  linksCard: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  activitySummary: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textMuted,
    textAlign: 'center',
  },
  shareError: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.error,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  shareErrorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.error,
  },
});
