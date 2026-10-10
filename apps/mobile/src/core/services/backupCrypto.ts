import { gcm } from '@noble/ciphers/aes.js';
import { scrypt } from '@noble/hashes/scrypt.js';
import { randomBytes } from '@noble/hashes/utils.js';
import { AppError, BACKUP_MAGIC, ERROR_CODES } from '@habitos/shared';

/**
 * backupCrypto — cifrado del backup (HU-28 · M24).
 * scrypt (N=16384, r=8, p=1) + AES-256-GCM. PURO (sin I/O) → testeable en Jest.
 *
 * Formato del archivo: MAGIC(10) | salt(16) | nonce(12) | ciphertext+tag(16)
 */

const MAGIC_BYTES = new TextEncoder().encode(BACKUP_MAGIC);
const SALT_LEN = 16;
const NONCE_LEN = 12;
const KEY_LEN = 32;

const SCRYPT_OPTS = { N: 16_384, r: 8, p: 1, dkLen: KEY_LEN } as const;

function deriveKey(password: string, salt: Uint8Array): Uint8Array {
  return scrypt(new TextEncoder().encode(password), salt, SCRYPT_OPTS);
}

/** JSON → bytes cifrados. */
export function encryptJson(value: unknown, password: string): Uint8Array {
  const salt = randomBytes(SALT_LEN);
  const nonce = randomBytes(NONCE_LEN);
  const key = deriveKey(password, salt);
  const plain = new TextEncoder().encode(JSON.stringify(value));
  const sealed = gcm(key, nonce).encrypt(plain);

  const out = new Uint8Array(MAGIC_BYTES.length + SALT_LEN + NONCE_LEN + sealed.length);
  out.set(MAGIC_BYTES, 0);
  out.set(salt, MAGIC_BYTES.length);
  out.set(nonce, MAGIC_BYTES.length + SALT_LEN);
  out.set(sealed, MAGIC_BYTES.length + SALT_LEN + NONCE_LEN);
  return out;
}

/**
 * Bytes → JSON. Distinción de errores (R9/HU-28):
 * - header inválido → BACKUP_CORRUPT
 * - tag GCM inválido → BACKUP_PASSWORD_INVALID (contraseña incorrecta)
 * - JSON ilegible pese a descifrar bien → BACKUP_CORRUPT
 */
export function decryptJson(bytes: Uint8Array, password: string): unknown {
  const magicLen = MAGIC_BYTES.length;
  if (bytes.length < magicLen + SALT_LEN + NONCE_LEN + 16) {
    throw new AppError(ERROR_CODES.BACKUP_CORRUPT, 'El archivo no es un backup válido');
  }
  for (let i = 0; i < magicLen; i++) {
    if (bytes[i] !== MAGIC_BYTES[i]) {
      throw new AppError(ERROR_CODES.BACKUP_CORRUPT, 'El archivo no es un backup válido');
    }
  }

  const salt = bytes.subarray(magicLen, magicLen + SALT_LEN);
  const nonce = bytes.subarray(magicLen + SALT_LEN, magicLen + SALT_LEN + NONCE_LEN);
  const sealed = bytes.subarray(magicLen + SALT_LEN + NONCE_LEN);
  const key = deriveKey(password, salt);

  let plain: Uint8Array;
  try {
    plain = gcm(key, nonce).decrypt(sealed);
  } catch {
    throw new AppError(ERROR_CODES.BACKUP_PASSWORD_INVALID, 'Contraseña incorrecta');
  }

  try {
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    throw new AppError(ERROR_CODES.BACKUP_CORRUPT, 'El contenido del backup está dañado');
  }
}

/** base64 estándar (Hermes no tiene Buffer). */
export function bytesToBase64(bytes: Uint8Array): string {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]!;
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += ALPHABET[b0 >> 2];
    out += ALPHABET[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += b1 === undefined ? '=' : ALPHABET[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    out += b2 === undefined ? '=' : ALPHABET[b2 & 63];
  }
  return out;
}

export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const padding = (b64.match(/=+$/)?.[0].length ?? 0) % 4;
  const out = new Uint8Array(((clean.length + padding) * 3) / 4 - padding);
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = decodeChar(clean[i]!);
    const c1 = i + 1 < clean.length ? decodeChar(clean[i + 1]!) : 0;
    const c2 = i + 2 < clean.length ? decodeChar(clean[i + 2]!) : 0;
    const c3 = i + 3 < clean.length ? decodeChar(clean[i + 3]!) : 0;
    if (o < out.length) out[o++] = (c0 << 2) | (c1 >> 4);
    if (o < out.length) out[o++] = ((c1 & 15) << 4) | (c2 >> 2);
    if (o < out.length) out[o++] = ((c2 & 3) << 6) | c3;
  }
  return out;
}

function decodeChar(c: string): number {
  const code = c.charCodeAt(0);
  if (code >= 65 && code <= 90) return code - 65;
  if (code >= 97 && code <= 122) return code - 71;
  if (code >= 48 && code <= 57) return code + 4;
  if (code === 43) return 62; // '+'
  if (code === 47) return 63; // '/'
  return 0;
}
