import { AppError, ERROR_CODES, LIMITS } from '@habitos/shared';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { scrypt } from '@noble/hashes/scrypt.js';
import { hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { PrefKeys, prefs } from './preferences';

const PIN_SALT_KEY = 'pin.salt';
const PIN_HASH_KEY = 'pin.hash';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

function derive(pin: string, saltHex: string): string {
  const key = scrypt(utf8ToBytes(pin), hexToBytes(saltHex), {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    dkLen: 32,
  });
  return bytesToHex(key);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isPinConfigured(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PIN_HASH_KEY)) != null;
}

export async function setupPin(pin: string): Promise<void> {
  if (pin.length !== LIMITS.PIN_LENGTH) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, `El PIN debe tener ${LIMITS.PIN_LENGTH} dígitos`);
  }
  const salt = bytesToHex(getRandomBytes(16));
  await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
  await SecureStore.setItemAsync(PIN_HASH_KEY, derive(pin, salt));
  clearPinAttempts();
}

/** Cambio de PIN desde Perfil → Seguridad (R7): exige el PIN actual. */
export async function changePin(currentPin: string, newPin: string): Promise<void> {
  const ok = await verifyPin(currentPin);
  if (!ok) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'El PIN actual no es correcto');
  }
  await setupPin(newPin);
}

/** Backoff: 5 fallos → bloqueo exponencial (HU-2, flujo F6 RATE_LIMITED). */
export function getPinLockRemainingMs(): number {
  const until = prefs.getNumber(PrefKeys.pinLockedUntil) ?? 0;
  return Math.max(0, until - Date.now());
}

export function clearPinAttempts(): void {
  prefs.set(PrefKeys.pinAttempts, 0);
  prefs.set(PrefKeys.pinLockedUntil, 0);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const remaining = getPinLockRemainingMs();
  if (remaining > 0) {
    throw new AppError(
      ERROR_CODES.RATE_LIMITED,
      `Demasiados intentos. Intenta de nuevo en ${Math.ceil(remaining / 1000)}s`,
    );
  }

  const salt = await SecureStore.getItemAsync(PIN_SALT_KEY);
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  if (!salt || !hash) return false;

  const ok = timingSafeEqualHex(derive(pin, salt), hash);
  if (ok) {
    clearPinAttempts();
    return true;
  }

  const attempts = (prefs.getNumber(PrefKeys.pinAttempts) ?? 0) + 1;
  prefs.set(PrefKeys.pinAttempts, attempts);
  if (attempts >= LIMITS.PIN_MAX_ATTEMPTS) {
    const over = attempts - LIMITS.PIN_MAX_ATTEMPTS;
    const lockMs = LIMITS.PIN_BACKOFF_BASE_MS * Math.pow(2, over);
    clearPinAttempts();
    prefs.set(PrefKeys.pinLockedUntil, Date.now() + lockMs);
    throw new AppError(
      ERROR_CODES.RATE_LIMITED,
      `PIN bloqueado durante ${Math.ceil(lockMs / 1000)}s`,
    );
  }
  return false;
}
