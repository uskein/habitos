/** USER_PROFILE — MODELO_DE_DATOS §2.1 (uno por dispositivo en MVP) */

export interface UserProfile {
  id: string;
  displayName: string;
  avatarSeed: number;
  locale: string;
  themeMode: 'light' | 'dark' | 'system';
  createdAt: string;
  /** V2 · HU-14 — ruta en documentDirectory/photos (null = iniciales). */
  photoUri?: string | null;
}
