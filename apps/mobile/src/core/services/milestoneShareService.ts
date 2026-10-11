import { AppError, ERROR_CODES } from '@habitos/shared';
import {
  ClipOp,
  ImageFormat,
  Skia,
  TileMode,
  rrect,
  type SkFont,
  type SkTypeface,
} from '@shopify/react-native-skia';
import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'react-native';
import { getDb } from '../data/database';
import { base64ToBytes } from './backupCrypto';
import { palette } from '../theme/theme';

/**
 * milestoneShareService — HU-29 · M23 (contrato: agregado interno).
 * render(milestoneId): tarjeta 1080×1080 offscreen (gradiente Pulse Clay + foto +
 * nombre + fecha + crédito) → PNG temporal → la pantalla abre expo-sharing.
 * Fallo de render → SHARE_RENDER_FAILED (retry in-situ en la pantalla).
 */

const SIZE = 1080;

const FONT_ASSETS = {
  display: require('../../../assets/fonts/Sora-Variable.ttf'),
  body: require('../../../assets/fonts/PlusJakartaSans-Variable.ttf'),
} as const;

/**
 * Carga un typeface desde los assets bundle. Fallbacks: (1) archivo embebido
 * vía Paths.bundle, (2) URI del bundle JS (Metro en dev), (3) null → fuente
 * del sistema (Skia.Font() sin typeface nunca lanza).
 * NOTA: `Skia.Font(undefined, size)` lanza «Value is undefined, expected an
 * Object» (JSI) — por eso jamás se pasa undefined explícito.
 */
const typefaceCache = new Map<string, SkTypeface | null>();

async function loadTypeface(module: number, file: string): Promise<SkTypeface | null> {
  const cached = typefaceCache.get(file);
  if (cached !== undefined) return cached;
  let tf: SkTypeface | null = null;
  try {
    const bundled = new File(Paths.bundle, `assets/fonts/${file}`);
    if (bundled.exists) {
      tf = Skia.Typeface.MakeFreeTypeFaceFromData(Skia.Data.fromBytes(await bundled.bytes()));
    }
  } catch {
    tf = null;
  }
  if (!tf) {
    try {
      const uri = Image.resolveAssetSource(module)?.uri;
      if (uri) tf = Skia.Typeface.MakeFreeTypeFaceFromData(await Skia.Data.fromURI(uri));
    } catch {
      tf = null;
    }
  }
  if (!tf) console.warn('[share] typeface no disponible:', file);
  typefaceCache.set(file, tf);
  return tf;
}

function fontOf(tf: SkTypeface | null, size: number): SkFont {
  if (tf) return Skia.Font(tf, size);
  const fallback = Skia.Font();
  fallback.setSize(size);
  return fallback;
}

interface MilestoneRow {
  title: string;
  occurred_at: string;
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const milestoneShareService = {
  /** Renderiza la tarjeta y devuelve la URI del PNG en cache. */
  async render(milestoneId: string): Promise<string> {
    try {
      const db = await getDb();
      const milestone = await db.getFirstAsync<MilestoneRow>(
        'SELECT title, occurred_at FROM milestone WHERE id = ?',
        milestoneId,
      );
      if (!milestone) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Hito no encontrado');
      }
      const images = await db.getAllAsync<{ uri: string }>(
        'SELECT uri FROM milestone_image WHERE milestone_id = ? ORDER BY position',
        milestoneId,
      );

      const surface = Skia.Surface.MakeOffscreen(SIZE, SIZE);
      if (!surface) throw new Error('offscreen surface no disponible');
      const canvas = surface.getCanvas();

      // 1) Fondo gradiente Pulse Clay (diagonal).
      const bg = Skia.Paint();
      bg.setShader(
        Skia.Shader.MakeLinearGradient(
          { x: 0, y: 0 },
          { x: SIZE, y: SIZE },
          [Skia.Color(palette.primary), Skia.Color(palette.primaryActive), Skia.Color(palette.secondary)],
          null,
          TileMode.Clamp,
        ),
      );
      canvas.drawRect({ x: 0, y: 0, width: SIZE, height: SIZE }, bg);

      // 2) Tarjeta clay central.
      const card = { x: 90, y: 130, width: 900, height: 820 };
      const cardPaint = Skia.Paint();
      cardPaint.setColor(Skia.Color(palette.surface));
      cardPaint.setAntiAlias(true);
      canvas.drawRRect(rrect(card, 48, 48), cardPaint);

      // 3) Foto del hito (si existe) — recorte redondeado.
      let photoBottom = card.y + 60;
      const first = images[0];
      if (first) {
        const file = new File(first.uri);
        if (file.exists) {
          const encoded = Skia.Data.fromBytes(await file.bytes());
          const img = Skia.Image.MakeImageFromEncoded(encoded);
          if (img) {
          const dst = { x: 140, y: card.y + 50, width: 800, height: 420 };
          const imgPaint = Skia.Paint();
          canvas.save();
          canvas.clipRRect(rrect(dst, 32, 32), ClipOp.Intersect, true);
          canvas.drawImageRect(
            img,
            { x: 0, y: 0, width: img.width(), height: img.height() },
            dst,
            imgPaint,
            true,
          );
          canvas.restore();
          photoBottom = dst.y + dst.height;
          }
        }
      }

      // 4) Textos: título, fecha y crédito.
      const titleFont = fontOf(await loadTypeface(FONT_ASSETS.display, 'Sora-Variable.ttf'), 54);
      // El binding JSI de Skia usa asNumber() pese a la firma boolean → 1/0.
      titleFont.setEmbolden(1 as unknown as boolean);
      const subFont = fontOf(await loadTypeface(FONT_ASSETS.body, 'PlusJakartaSans-Variable.ttf'), 34);
      const brandFont = fontOf(await loadTypeface(FONT_ASSETS.body, 'PlusJakartaSans-Variable.ttf'), 30);

      const titlePaint = Skia.Paint();
      titlePaint.setColor(Skia.Color(palette.text));
      const mutedPaint = Skia.Paint();
      mutedPaint.setColor(Skia.Color(palette.textMuted));
      const brandPaint = Skia.Paint();
      brandPaint.setColor(Skia.Color(palette.primary));

      const textX = card.x + 50;
      canvas.drawText(milestone.title, textX, photoBottom + 100, titlePaint, titleFont);
      canvas.drawText(fmtDate(milestone.occurred_at), textX, photoBottom + 160, mutedPaint, subFont);

      const brand = 'App Hábitos · hecho con ❤';
      const brandWidth = brandFont.measureText(brand).width;
      canvas.drawText(brand, SIZE / 2 - brandWidth / 2, card.y + card.height - 50, brandPaint, brandFont);

      // 5) Snapshot → PNG → archivo temporal.
      surface.flush();
      const snapshot = surface.makeImageSnapshot();
      const b64 = snapshot.encodeToBase64(ImageFormat.PNG, 100);
      if (!b64) throw new Error('encodeToBase64 devolvió vacío');

      const dir = new Directory(Paths.cache, 'share');
      if (!dir.exists) dir.create({ intermediates: true });
      const out = new File(dir, `${milestoneId}.png`);
      out.write(base64ToBytes(b64));
      surface.dispose();
      return out.uri;
    } catch (e) {
      if (e instanceof AppError && e.code === ERROR_CODES.NOT_FOUND) throw e;
      console.error('[share] render falló:', e);
      throw new AppError(
        ERROR_CODES.SHARE_RENDER_FAILED,
        'No se pudo renderizar la tarjeta para compartir',
      );
    }
  },
};
