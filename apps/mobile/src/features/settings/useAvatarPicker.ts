import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { deleteImage, saveImage } from '@/core/data/imageStore';
import { userProfileRepository } from '@/core/repositories/userProfileRepository';
import { systemSheet } from '@/core/storage/systemSheet';
import { useToast } from '@/ui/feedback/Toast';

/**
 * useAvatarPicker (V2 · HU-14/15) — permisos → picker → imageStore (≤250 KB,
 * UUID anti path-traversal) → user_profile.photo_uri. El binario anterior se
 * borra tras persistir la nueva ruta.
 */
export function useAvatarPicker() {
  const toast = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ['profile'] }), [qc]);

  const pickPhoto = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        toast.show('Se necesita permiso de fotos para cambiar tu avatar', 'error');
        return;
      }
      const res = await systemSheet.run(() =>
        ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        }),
      );
      const asset = res.canceled ? undefined : res.assets[0];
      if (!asset) return;

      const saved = await saveImage(asset.uri, 'avatar');
      const prev = await userProfileRepository.get();
      await userProfileRepository.setPhoto(saved);
      if (prev?.photoUri && prev.photoUri !== saved) deleteImage(prev.photoUri);
      await refresh();
      toast.show('Foto de perfil actualizada', 'success');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'No se pudo guardar la foto', 'error');
    } finally {
      setBusy(false);
    }
  }, [busy, refresh, toast]);

  const removePhoto = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const prev = await userProfileRepository.get();
      await userProfileRepository.clearPhoto();
      if (prev?.photoUri) deleteImage(prev.photoUri);
      await refresh();
      toast.show('Foto eliminada', 'success');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'No se pudo quitar la foto', 'error');
    } finally {
      setBusy(false);
    }
  }, [busy, refresh, toast]);

  return { pickPhoto, removePhoto, busy };
}
