import { randomUUID } from 'expo-crypto';
import * as ImageManipulator from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';
import { AppError, ERROR_CODES, LIMITS } from '@habitos/shared';

/**
 * imageStore (V2 · GUIA_DEVOPS_SEGURIDAD §fotos + ADR-011) —
 * Los binarios viven en FileSystem.documentDirectory con nombre SOLO UUID
 * (anti path-traversal). SQLite guarda únicamente la ruta.
 */

const PHOTOS_DIR = new Directory(Paths.document, 'photos');
const EXT = '.jpg';

function ensureDir(): Directory {
  if (!PHOTOS_DIR.exists) PHOTOS_DIR.create({ intermediates: true });
  return PHOTOS_DIR;
}

function validateBytes(bytes: number, max: number): void {
  if (bytes > max) {
    throw new AppError(ERROR_CODES.IMAGE_TOO_LARGE, 'La imagen supera el tamaño permitido');
  }
}

function validateMime(type: string): void {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
    throw new AppError(ERROR_CODES.IMAGE_INVALID_TYPE, 'Formato de imagen no permitido');
  }
}

/** Copia un asset del picker a documentDirectory con nombre UUID y compresión. */
export async function saveImage(
  sourceUri: string,
  kind: 'avatar' | 'milestone',
): Promise<string> {
  const maxBytes =
    kind === 'avatar' ? LIMITS.PHOTO_AVATAR_MAX_BYTES : LIMITS.PHOTO_MILESTONE_MAX_BYTES;
  const width = kind === 'avatar' ? 512 : 1440;

  const manipulated = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );

  const src = new File(manipulated.uri);
  if (!src.exists) {
    throw new AppError(ERROR_CODES.IMAGE_INVALID_TYPE, 'No se pudo leer la imagen');
  }
  validateMime(src.type || 'image/jpeg');
  validateBytes(src.size, maxBytes);

  const dir = ensureDir();
  const target = new File(dir, `${randomUUID()}${EXT}`);
  src.copy(target);
  return target.uri;
}

/** Elimina una imagen guardada (borrado de hito / quitar foto). */
export function deleteImage(uri: string): void {
  if (!uri.startsWith(Paths.document.uri)) return; // solo nuestras rutas
  const file = new File(uri);
  if (file.exists) file.delete();
}

/** Elimina en lote (limpieza de un hito). */
export function deleteImages(uris: string[]): void {
  for (const uri of uris) deleteImage(uri);
}
