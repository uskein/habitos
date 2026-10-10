import {
  CreateMilestoneInput,
  LIMITS,
  localDateISO,
  type CreateMilestoneInputType,
} from '@habitos/shared';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { saveImage } from '@/core/data/imageStore';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';
import { useGoals } from '@/features/goals/useGoals';
import { useActiveHabits, useCreateMilestone } from '@/features/milestones/useMilestones';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { useToast } from '@/ui/feedback/Toast';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayCard } from '@/ui/primitives/ClayCard';
import { ClayCheckbox } from '@/ui/primitives/ClayCheckbox';
import { ClayInput } from '@/ui/primitives/ClayInput';

/**
 * Sheet crear hito — HU-17 · F12 · BP 12/14.
 * Zod: título 1–80, ≥1 ligazón, ≤10 fotos; guardado transaccional (M15).
 */
export default function NewHitoSheet() {
  const toast = useToast();
  const create = useCreateMilestone();
  const habits = useActiveHabits();
  const goals = useGoals('active');
  const { habitId, goalId } = useLocalSearchParams<{ habitId?: string; goalId?: string }>();

  const [title, setTitle] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => localDateISO());
  const [note, setNote] = useState('');
  const [links, setLinks] = useState<Set<string>>(
    () =>
      new Set(
        [habitId ? `habit:${habitId}` : null, goalId ? `goal:${goalId}` : null].filter(
          (v): v is string => !!v,
        ),
      ),
  );
  const [images, setImages] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [touched, setTouched] = useState(false);

  if (habits.isPending || goals.isPending) {
    return (
      <View style={styles.body}>
        <Text style={styles.title}>Nuevo hito</Text>
        <Skeleton height={56} borderRadius={16} />
        <Skeleton height={120} borderRadius={16} />
        <Skeleton height={120} borderRadius={16} />
      </View>
    );
  }

  if (habits.isError || goals.isError) {
    return (
      <View style={styles.body}>
        <EmptyState
          title="No se pudieron cargar tus hábitos y metas"
          blob="⚠"
          action={
            <ClayButton
              label="Reintentar"
              onPress={() => {
                void habits.refetch();
                void goals.refetch();
              }}
            />
          }
        />
      </View>
    );
  }

  const noEntities = (habits.data?.length ?? 0) === 0 && (goals.data?.length ?? 0) === 0;
  if (noEntities) {
    return (
      <View style={styles.body}>
        <EmptyState
          title="Aún no tienes hábitos ni metas"
          description="Un hito necesita al menos 1 ligazón a un hábito o meta."
          blob="◈"
          action={<ClayButton label="Cerrar" variant="secondary" onPress={() => router.back()} />}
        />
      </View>
    );
  }

  const titleError =
    touched && title.trim().length === 0
      ? 'El título es obligatorio'
      : touched && title.trim().length > LIMITS.MILESTONE_TITLE_MAX
        ? `Máximo ${LIMITS.MILESTONE_TITLE_MAX} caracteres`
        : undefined;
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(occurredAt);
  const dateError = touched && !dateOk ? 'Formato: YYYY-MM-DD' : undefined;
  const linksError = touched && links.size === 0 ? 'Selecciona al menos 1 ligazón' : undefined;

  const toggleLink = (key: string) =>
    setLinks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const addPhotos = async () => {
    if (picking || images.length >= LIMITS.MILESTONE_IMAGES_MAX) return;
    setPicking(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        toast.show('Se necesita permiso de fotos para adjuntar imágenes', 'error');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: LIMITS.MILESTONE_IMAGES_MAX - images.length,
        quality: 0.9,
      });
      const assets = res.canceled ? [] : res.assets;
      let saved = 0;
      let failed = 0;
      for (const asset of assets) {
        try {
          const uri = await saveImage(asset.uri, 'milestone');
          setImages((prev) =>
            prev.length < LIMITS.MILESTONE_IMAGES_MAX && !prev.includes(uri) ? [...prev, uri] : prev,
          );
          saved++;
        } catch {
          failed++;
        }
      }
      if (failed > 0) {
        toast.show(
          `${saved} fotos añadidas · ${failed} descartadas (máx. 2 MB cada una)`,
          'error',
        );
      } else if (saved > 0) {
        toast.show(`${saved} foto${saved > 1 ? 's' : ''} añadida${saved > 1 ? 's' : ''}`, 'success');
      }
    } finally {
      setPicking(false);
    }
  };

  const submit = () => {
    setTouched(true);
    const input: CreateMilestoneInputType = {
      title: title.trim(),
      note: note.trim() ? note.trim() : null,
      occurredAt,
      links: [...links].map((k) => {
        const [entityType, entityId] = k.split(':');
        return { entityType: entityType as 'habit' | 'goal', entityId: entityId ?? '' };
      }),
      imageUris: images,
    };
    const parsed = CreateMilestoneInput.safeParse(input);
    if (!parsed.success) {
      toast.show('Revisa los campos del formulario', 'error');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        toast.show('Hito guardado 🏁', 'success');
        router.back();
      },
      onError: (e) => toast.show(e instanceof Error ? e.message : 'No se pudo guardar', 'error'),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Nuevo hito</Text>

      <ClayInput
        label="Título"
        placeholder="Ej. Primer 10 k"
        value={title}
        onChangeText={setTitle}
        onBlur={() => setTouched(true)}
        maxLength={LIMITS.MILESTONE_TITLE_MAX}
        error={titleError}
        helper={`${title.trim().length}/${LIMITS.MILESTONE_TITLE_MAX}`}
      />
      <ClayInput
        label="Fecha"
        placeholder="YYYY-MM-DD"
        value={occurredAt}
        onChangeText={setOccurredAt}
        onBlur={() => setTouched(true)}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        error={dateError}
        helper="Cuándo ocurrió"
      />
      <ClayInput
        label="Nota (opcional)"
        placeholder="Un recuerdo de ese día…"
        value={note}
        onChangeText={setNote}
        onBlur={() => setTouched(true)}
        maxLength={LIMITS.MILESTONE_NOTE_MAX}
        helper={`${note.length}/${LIMITS.MILESTONE_NOTE_MAX}`}
      />

      <Text style={styles.sectionTitle}>Ligazones (mín. 1)</Text>
      {linksError ? <Text style={styles.error}>{linksError}</Text> : null}
      {habits.data && habits.data.length > 0 ? (
        <ClayCard style={styles.linkCard}>
          <Text style={styles.groupTitle}>Hábitos</Text>
          {habits.data.map((h) => (
            <ClayCheckbox
              key={h.id}
              label={`${h.icon}  ${h.name}`}
              checked={links.has(`habit:${h.id}`)}
              onCheckedChange={() => toggleLink(`habit:${h.id}`)}
            />
          ))}
        </ClayCard>
      ) : null}
      {goals.data && goals.data.length > 0 ? (
        <ClayCard style={styles.linkCard}>
          <Text style={styles.groupTitle}>Metas</Text>
          {goals.data.map((g) => (
            <ClayCheckbox
              key={g.id}
              label={g.title}
              checked={links.has(`goal:${g.id}`)}
              onCheckedChange={() => toggleLink(`goal:${g.id}`)}
            />
          ))}
        </ClayCard>
      ) : null}

      <Text style={styles.sectionTitle}>
        Fotos ({images.length}/{LIMITS.MILESTONE_IMAGES_MAX})
      </Text>
      <View style={styles.photoRow}>
        {images.map((uri, i) => (
          <View key={uri} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Quitar foto ${i + 1}`}
              onPress={() => setImages((prev) => prev.filter((u) => u !== uri))}
              style={styles.thumbRemove}
              hitSlop={6}
            >
              <Text style={styles.thumbRemoveText}>×</Text>
            </Pressable>
          </View>
        ))}
        {images.length < LIMITS.MILESTONE_IMAGES_MAX ? (
          <ClayButton
            label="+ Fotos"
            variant="secondary"
            loading={picking}
            disabled={picking}
            onPress={() => void addPhotos()}
          />
        ) : null}
      </View>

      <ClayButton
        label="Guardar hito"
        loading={create.isPending}
        disabled={create.isPending || title.trim().length === 0 || !dateOk}
        onPress={submit}
        style={styles.submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
    paddingTop: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 22,
    color: palette.text,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 15,
    color: palette.text,
    marginTop: spacing.sm,
    marginLeft: 4,
  },
  groupTitle: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 12,
    color: palette.textMuted,
    marginBottom: spacing.xs,
  },
  linkCard: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.error,
    marginLeft: 4,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceAlt,
  },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.error,
    lineHeight: 18,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
