import { ClipOp, ImageFormat, Skia, TileMode, rrect, type SkFont, type SkTypeface } from '@shopify/react-native-skia';
import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'react-native';
import { getDb } from '../data/database';
import { base64ToBytes } from './backupCrypto';

/**
 * streakShareService — M38 · comparte tu racha.
 * render(): tarjeta 1080×1080 offscreen (gradiente Pulse Clay + avatar +
 * racha actual/mejor + badge de nivel) → PNG temporal → expo-sharing.
 * Mismo patrón de render/offscreen que milestoneShareService.
 */

const SIZE = 1080;

const FONT_ASSETS = {
  display: require('../../../assets/fonts/Sora-Variable.ttf'),
  body: require('../../../assets/fonts/PlusJakartaSans-Variable.ttf'),
} as const;

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
  if (!tf) console.warn('[streakShare] typeface no disponible:', file);
  typefaceCache.set(file, tf);
  return tf;
}

function fontOf(tf: SkTypeface | null, size: number): SkFont {
  if (tf) return Skia.Font(tf, size);
  const fallback = Skia.Font();
  fallback.setSize(size);
  return fallback;
}

export const streakShareService = {
  /** Renderiza la tarjeta de racha y devuelve la URI del PNG en cache. */
  async render(): Promise<string> {
    const db = await getDb();
    const streak = await db.getFirstAsync<{
      global_current_streak: number;
      global_best_streak: number;
    }>('SELECT global_current_streak, global_best_streak FROM streak_cache LIMIT 1');
    const profile = await db.getFirstAsync<{ photo_uri: string | null; display_name: string }>(
      'SELECT photo_uri, display_name FROM user_profile LIMIT 1',
    );
    const current = streak?.global_current_streak ?? 0;
    const best = streak?.global_best_streak ?? 0;
    const level = Math.min(10, Math.floor(best / 3) + 1);

    const surface = Skia.Surface.MakeOffscreen(SIZE, SIZE);
    if (!surface) throw new Error('offscreen surface no disponible');
    const canvas = surface.getCanvas();

    // 1) Fondo gradiente Pulse Clay (diagonal).
    const bg = Skia.Paint();
    bg.setShader(
      Skia.Shader.MakeLinearGradient(
        { x: 0, y: 0 },
        { x: SIZE, y: SIZE },
        [Skia.Color('#6D4BF5'), Skia.Color('#4F32CC'), Skia.Color('#2EC4B6')],
        null,
        TileMode.Clamp,
      ),
    );
    canvas.drawRect({ x: 0, y: 0, width: SIZE, height: SIZE }, bg);

    // 2) Tarjeta clay central.
    const card = { x: 90, y: 130, width: 900, height: 820 };
    const cardPaint = Skia.Paint();
    cardPaint.setColor(Skia.Color('#FFFFFF'));
    cardPaint.setAntiAlias(true);
    canvas.drawRRect(rrect(card, 48, 48), cardPaint);

    // 3) Avatar circular (si existe).
    let avatarBottom = card.y + 80;
    const photoUri = profile?.photo_uri;
    if (photoUri) {
      const file = new File(photoUri);
      if (file.exists) {
        const img = Skia.Image.MakeImageFromEncoded(
          Skia.Data.fromBytes(await file.bytes()),
        );
        if (img) {
          const dst = { x: 390, y: card.y + 60, width: 300, height: 300 };
          const imgPaint = Skia.Paint();
          canvas.save();
          canvas.clipRRect(rrect(dst, 150, 150), ClipOp.Intersect, true);
          canvas.drawImageRect(
            img,
            { x: 0, y: 0, width: img.width(), height: img.height() },
            dst,
            imgPaint,
            true,
          );
          canvas.restore();
          avatarBottom = dst.y + dst.height;
        }
      }
    }

    // 4) Textos.
    const titleFont = fontOf(await loadTypeface(FONT_ASSETS.display, 'Sora-Variable.ttf'), 44);
    titleFont.setEmbolden(1 as unknown as boolean);
    const bigFont = fontOf(await loadTypeface(FONT_ASSETS.display, 'Sora-Variable.ttf'), 120);
    bigFont.setEmbolden(1 as unknown as boolean);
    const bodyFont = fontOf(await loadTypeface(FONT_ASSETS.body, 'PlusJakartaSans-Variable.ttf'), 38);
    const badgeFont = fontOf(await loadTypeface(FONT_ASSETS.body, 'PlusJakartaSans-Variable.ttf'), 34);
    badgeFont.setEmbolden(1 as unknown as boolean);
    const brandFont = fontOf(await loadTypeface(FONT_ASSETS.body, 'PlusJakartaSans-Variable.ttf'), 30);

    const firePaint = Skia.Paint();
    firePaint.setColor(Skia.Color('#6D4BF5'));
    const streakPaint = Skia.Paint();
    streakPaint.setColor(Skia.Color('#FF6B6B'));
    const mutedPaint = Skia.Paint();
    mutedPaint.setColor(Skia.Color('#67617E'));
    const badgeTextPaint = Skia.Paint();
    badgeTextPaint.setColor(Skia.Color('#B45309'));

    const center = SIZE / 2;

    // 🔥 título
    const title = `Racha de ${profile?.display_name ?? 'Hábitos'}`;
    const titleW = titleFont.measureText(title).width;
    canvas.drawText(title, center - titleW / 2, avatarBottom + 100, firePaint, titleFont);

    // Cifra grande de racha
    const bigText = `${current} 🔥`;
    const bigW = bigFont.measureText(bigText).width;
    canvas.drawText(bigText, center - bigW / 2, avatarBottom + 230, streakPaint, bigFont);

    // Mejor racha
    const bestText = `Mejor racha: ${best} días`;
    const bestW = bodyFont.measureText(bestText).width;
    canvas.drawText(bestText, center - bestW / 2, avatarBottom + 300, mutedPaint, bodyFont);

    // Badge de nivel (pill)
    const badgeText = `Nivel ${level}`;
    const badgeW = badgeFont.measureText(badgeText).width;
    const badgeRect = { x: center - badgeW / 2 - 28, y: avatarBottom + 340, width: badgeW + 56, height: 60 };
    const badgePaint = Skia.Paint();
    badgePaint.setColor(Skia.Color('#FEF3C7'));
    badgePaint.setAntiAlias(true);
    canvas.drawRRect(rrect(badgeRect, 30, 30), badgePaint);
    canvas.drawText(badgeText, center - badgeW / 2, badgeRect.y + 42, badgeTextPaint, badgeFont);

    // Crédito de marca
    const brand = 'App Hábitos · hecho con ❤';
    const brandW = brandFont.measureText(brand).width;
    canvas.drawText(brand, center - brandW / 2, card.y + card.height - 50, mutedPaint, brandFont);

    // 5) Snapshot → PNG → archivo temporal.
    surface.flush();
    const snapshot = surface.makeImageSnapshot();
    const b64 = snapshot.encodeToBase64(ImageFormat.PNG, 100);
    if (!b64) throw new Error('encodeToBase64 devolvió vacío');

    const dir = new Directory(Paths.cache, 'share');
    if (!dir.exists) dir.create({ intermediates: true });
    const out = new File(dir, `racha-${Date.now()}.png`);
    out.write(base64ToBytes(b64));
    surface.dispose();
    return out.uri;
  },
};
